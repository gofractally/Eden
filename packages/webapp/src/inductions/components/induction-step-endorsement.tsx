import React, { useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

import {
    assetToString,
    Form,
    Heading,
    Link,
    Text,
    useUALAccount,
    onError,
    ActionButton,
} from "_app";
import { minimumDonationAmount } from "config";

import { Endorsement, Induction } from "../interfaces";
import {
    submitEndorsementTransaction,
    donateAndCompleteInductionTransaction,
} from "../transactions";
import {
    convertPendingProfileToMemberData,
    getInductionRemainingTimeDays,
} from "../utils";
import {
    InductionJourneyContainer,
    InductionRole,
    MemberCardPreview,
} from "inductions";

interface Props {
    induction: Induction;
    endorsements: Endorsement[];
    setReviewStep: (step: "profile" | "video") => void;
}

export const InductionStepEndorsement = (props: Props) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();
    const [isLoading, setLoading] = useState(false);
    const [endorsements, setEndorsements] = useState([...props.endorsements]);

    const induction = props.induction;

    const submitEndorsement = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = await submitEndorsementTransaction(
                authorizerAccount,
                induction
            );
            console.info(transaction);

            setLoading(true);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductendors trx", signedTrx);

            await updateEndorsements();
        } catch (error) {
            onError(error, "Unable to submit endorsement");
        }

        setLoading(false);
    };

    const submitDonation = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = donateAndCompleteInductionTransaction(
                authorizerAccount,
                induction
            );
            console.info(transaction);

            setLoading(true);
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("donation trx", signedTrx);

            // tolerance time to make sure blockchain processed the transactions
            await new Promise((resolve) => setTimeout(resolve, 4000));

            // invalidate ["member", accountName] query so it will refetch with their full name
            queryClient.invalidateQueries(["member", authorizerAccount]);

            // router goes to the newly created member page
            router.push(`/members/${induction.invitee}`);
            return;
        } catch (error) {
            onError(
                error,
                "Unable to donate and complete the induction process"
            );
        }

        setLoading(false);
    };

    const updateEndorsements = async () => {
        // update the current endorsers list
        const updatedEndorsements = endorsements.map((endorsement) =>
            endorsement.endorser === ualAccount.accountName
                ? { ...endorsement, endorsed: 1 }
                : endorsement
        );
        setEndorsements(updatedEndorsements);
    };

    const memberData = convertPendingProfileToMemberData(induction);

    const isInvitee = ualAccount?.accountName === induction.invitee;

    const userEndorsement = endorsements.find(
        (endorsement) => endorsement.endorser === ualAccount?.accountName
    );

    const isFullyEndorsed =
        endorsements.filter((endorsement) => endorsement.endorsed === 1)
            .length === endorsements.length;

    const isPendingEndorser = Boolean(
        userEndorsement && !userEndorsement.endorsed
    );

    const getEndorserStatus = (endorsement: Endorsement) =>
        endorsement.endorsed ? (
            <span title="Endorsement Submitted" className="mr-2">
                ✅
            </span>
        ) : (
            <span title="Pending Endorsement" className="mr-2">
                🟡
            </span>
        );

    return (
        <>
            <InductionJourneyContainer
                role={
                    !ualAccount || isInvitee
                        ? InductionRole.INVITEE
                        : InductionRole.INVITER
                }
                step={isFullyEndorsed ? 4 : 3}
            >
                <Heading size={1} className="mb-2">
                    {isFullyEndorsed ? "Pending donation" : "Endorsements"}
                </Heading>
                <Text className="mb-6">
                    This invitation expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </Text>
                <div>
                    <Heading size={3} className="mb-2">
                        Endorsement status:
                    </Heading>
                    <ul className="mb-4 ml-2">
                        {endorsements.map((endorser) => (
                            <li key={endorser.id}>
                                {getEndorserStatus(endorser)}{" "}
                                {endorser.endorser}
                            </li>
                        ))}
                    </ul>
                    {isFullyEndorsed ? (
                        <DonationForm
                            isLoading={isLoading}
                            setReviewStep={props.setReviewStep}
                            submitDonation={submitDonation}
                            isInvitee={isInvitee}
                        />
                    ) : isPendingEndorser ? (
                        <EndorsingForm
                            isLoading={isLoading}
                            setReviewStep={props.setReviewStep}
                            submitEndorsement={submitEndorsement}
                        />
                    ) : isInvitee ? (
                        <div className="space-y-3">
                            <Text>
                                To continue, all witnesses must endorse.
                            </Text>
                            <Text>
                                Now is a good time to review your profile
                                information below. If anything needs to be
                                corrected,{" "}
                                <Link
                                    onClick={() =>
                                        props.setReviewStep("profile")
                                    }
                                >
                                    click here to make those adjustments.
                                </Link>{" "}
                                Keep in mind that any modifications to your
                                profile will reset any endorsements.
                            </Text>
                        </div>
                    ) : (
                        <Text>Waiting for all witnesses to endorse.</Text>
                    )}

                    {userEndorsement && !isPendingEndorser ? (
                        <div className="mt-4 space-y-3">
                            <Text>
                                In the meantime, we recommend reviewing the
                                prospective member profile information below for
                                accuracy. If anything needs to be corrected, ask
                                the invitee to sign in and make the corrections.
                            </Text>
                            <Text>
                                If the induction video needs to be corrected,{" "}
                                <Link
                                    onClick={() => props.setReviewStep("video")}
                                >
                                    click here
                                </Link>
                                . Keep in mind that modifying the induction
                                video will reset any endorsements.
                            </Text>
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            </InductionJourneyContainer>
            <MemberCardPreview memberData={memberData} />
        </>
    );
};

interface EndorsingFormProps {
    isLoading: boolean;
    setReviewStep: (step: "profile" | "video") => void;
    submitEndorsement: () => void;
}
const EndorsingForm = ({
    isLoading,
    setReviewStep,
    submitEndorsement,
}: EndorsingFormProps) => {
    const [isReviewed, setReviewed] = useState(false);
    return (
        <div className="space-y-3">
            <Text>
                <span className="underline font-medium">Carefully review</span>{" "}
                the prospective member profile information below. Make sure that
                all social handles and links are accurate and working. If
                anything needs to be corrected, ask the invitee to sign in and
                make the corrections.
            </Text>
            <Text>
                If the induction video needs to be corrected,{" "}
                <Link onClick={() => setReviewStep("video")}>click here</Link>.
                Keep in mind that modifying the induction video will reset any
                endorsements.
            </Text>
            <div className="flex items-end xl:items-center flex-col xl:flex-row p-3 border rounded-md">
                <Form.Checkbox
                    id="reviewed"
                    label="I have carefully reviewed the prospective member's profile information below and affirm my endorsement"
                    value={Number(isReviewed)}
                    onChange={() => setReviewed(!isReviewed)}
                />
                <div className="pt-1 justify-end">
                    <ActionButton
                        disabled={isLoading || !isReviewed}
                        onClick={submitEndorsement}
                    >
                        {isLoading ? "Submitting endorsement..." : "Submit"}
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};

interface DonationFormProps {
    isInvitee: boolean;
    isLoading: boolean;
    setReviewStep: (step: "profile" | "video") => void;
    submitDonation: () => void;
}
const DonationForm = ({
    isInvitee,
    isLoading,
    setReviewStep,
    submitDonation,
}: DonationFormProps) => {
    return isInvitee ? (
        <div className="space-y-3">
            <Text>
                This is your last chance to review your profile for completeness
                and accuracy. If anything needs to be corrected,{" "}
                <Link onClick={() => setReviewStep("profile")}>click here</Link>
                . Keep in mind that modifying your profile will require your
                endorsers to submit their endorsements again.
            </Text>
            <Text>
                If everything looks good, click on the button below to make your
                donation to the Eden community. Once completed, your membership
                will be activated and your Eden NFTs will be minted and
                distributed.
            </Text>
            <div className="pt-1">
                <ActionButton disabled={isLoading} onClick={submitDonation}>
                    {isLoading
                        ? "Submitting donation..."
                        : `Donate ${assetToString(minimumDonationAmount)}`}
                </ActionButton>
            </div>
        </div>
    ) : (
        <Text>
            This induction is fully endorsed! As soon as the prospective member
            completes their donation to the Eden community, their membership
            will be activated and their Eden NFTs will be minted and
            distributed.
        </Text>
    );
};
