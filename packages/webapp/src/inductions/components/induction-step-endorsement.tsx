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
    useMemberListByAccountNames,
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
    InductionJourney,
    MemberCardPreview,
} from "inductions";

interface Props {
    induction: Induction;
    endorsements: Endorsement[];
    isCommunityActive?: boolean;
    setReviewStep: (step: "profile" | "video") => void;
}

export const InductionStepEndorsement = (props: Props) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();
    const [isLoading, setLoading] = useState(false);
    const [endorsements, setEndorsements] = useState([...props.endorsements]);

    const endorsersMembers = useMemberListByAccountNames(
        props.endorsements.map((endorsement) => endorsement.endorser)
    );

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
            await new Promise((resolve) => setTimeout(resolve, 6000));

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

    const getEndorserName = (endorsement: Endorsement) => {
        const endorserMember = endorsersMembers.find(
            (query) => query.data?.account === endorsement.endorser
        );
        return endorserMember?.data?.name || endorsement.endorser;
    };

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

    const getInductionJourneyRole = () => {
        if (!props.isCommunityActive) {
            return InductionJourney.GENESIS;
        } else if (!ualAccount || isInvitee) {
            return InductionJourney.INVITEE;
        }
        return InductionJourney.INVITER;
    };

    const getInductionJourneyStep = () => {
        if (!props.isCommunityActive) {
            return 2;
        } else if (isFullyEndorsed) {
            return 4;
        }
        return 3;
    };

    return (
        <>
            <InductionJourneyContainer
                role={getInductionJourneyRole()}
                step={getInductionJourneyStep()}
            >
                <Heading size={1} className="mb-2">
                    {isFullyEndorsed ? "Pending donation" : "Endorsements"}
                </Heading>
                <Text className="mb-6">
                    This invitation expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </Text>
                <div>
                    {endorsements.length > 0 && (
                        <>
                            <Heading size={3} className="mb-2">
                                Endorsement status:
                            </Heading>
                            <ul className="mb-4 ml-2">
                                {endorsements.map((endorser) => (
                                    <li key={endorser.id}>
                                        {getEndorserStatus(endorser)}{" "}
                                        <Link
                                            href={`/members/${endorser.endorser}`}
                                        >
                                            <span className="text-gray-800 hover:underline">
                                                {getEndorserName(endorser)}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {isFullyEndorsed ? (
                        <DonationForm
                            isLoading={isLoading}
                            isCommunityActive={props.isCommunityActive}
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
    isCommunityActive?: boolean;
    isInvitee: boolean;
    isLoading: boolean;
    setReviewStep: (step: "profile" | "video") => void;
    submitDonation: () => void;
}
const DonationForm = ({
    isCommunityActive,
    isInvitee,
    isLoading,
    setReviewStep,
    submitDonation,
}: DonationFormProps) => {
    const [isProfileReviewed, setReviewedProfile] = useState(false);
    return isInvitee ? (
        <div className="space-y-3">
            <Text>
                This is your last chance to review your profile below for
                completeness and accuracy. If anything needs to be corrected,{" "}
                <Link onClick={() => setReviewStep("profile")}>click here</Link>
                .
                {isCommunityActive &&
                    " Keep in mind that modifying your profile will require your endorsers to submit their endorsements again."}
            </Text>
            <Text>
                If everything looks good, submit your donation to proceed.
                {isCommunityActive &&
                    " Once completed, your membership will be activated and your Eden NFTs will be minted and distributed."}
            </Text>
            <div className="p-3 border rounded-md">
                <Form.Checkbox
                    id="reviewed"
                    label="I have carefully reviewed my profile image, links and information below and confirm their accuracy. I understand that by submitting my donation, my Eden NFTs will be minted and changes to my profile or this NFT series will not be possible."
                    value={Number(isProfileReviewed)}
                    onChange={() => setReviewedProfile(!isProfileReviewed)}
                />
            </div>
            <div className="pt-1">
                <ActionButton
                    disabled={isLoading || !isProfileReviewed}
                    onClick={submitDonation}
                >
                    {isLoading
                        ? "Submitting donation..."
                        : `Donate ${assetToString(minimumDonationAmount)}`}
                </ActionButton>
            </div>
        </div>
    ) : isCommunityActive ? (
        <Text>
            This induction is fully endorsed! As soon as the prospective member
            completes their donation to the Eden community, their membership
            will be activated and their Eden NFTs will be minted and
            distributed.
        </Text>
    ) : (
        <Text>
            As soon as this prospective member completes their donation to the
            Eden community, their membership is ready for activation. Once all
            Genesis members are fully inducted, memberships will be activated
            and Eden NFTs will be distributed.
        </Text>
    );
};
