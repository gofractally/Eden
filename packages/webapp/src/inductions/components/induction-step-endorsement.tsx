import { useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

import {
    assetToString,
    Button,
    Form,
    Heading,
    Link,
    Text,
    useUALAccount,
    onError,
} from "_app";
import { minimumDonationAmount } from "config";

import { Endorsement, Induction } from "../interfaces";
import {
    submitEndorsementTransaction,
    donateAndCompleteInductionTransaction,
} from "../transactions";
import { NewMemberCardPreview } from "./new-member-card-preview";
import { convertPendingProfileToMemberData } from "../utils";

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
            <div className="text-lg mb-4 text-gray-900">
                {isFullyEndorsed
                    ? "Step 4/4: Waiting for Donation"
                    : "Step 3/4: Waiting for Endorsements"}
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-full">
                <div>
                    <Heading size={3} className="mb-2">
                        Endorsers
                    </Heading>
                    <ul className="mb-4">
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
                            submitDonation={submitDonation}
                            isInvitee={isInvitee}
                        />
                    ) : (
                        <EndorsingForm
                            isLoading={isLoading}
                            isPendingEndorser={isPendingEndorser}
                            submitEndorsement={submitEndorsement}
                        />
                    )}

                    {isInvitee && (
                        <div className="mt-4 text-center">
                            <Text>Your profile looks wrong?</Text>
                            <Link
                                onClick={() => props.setReviewStep("profile")}
                            >
                                Click Here to adjust Profile
                            </Link>
                        </div>
                    )}

                    {userEndorsement ? (
                        <div className="mt-4 text-center">
                            <Text>
                                The Induction Ceremony Video is Incorrect?
                            </Text>
                            <Link onClick={() => props.setReviewStep("video")}>
                                Click Here to adjust Induction Ceremony Video
                            </Link>
                        </div>
                    ) : (
                        ""
                    )}
                </div>
                <div>
                    <Heading size={3}>New Member Card Preview</Heading>
                    <NewMemberCardPreview member={memberData} />
                </div>
            </div>
        </>
    );
};

interface EndorsingFormProps {
    isPendingEndorser: boolean;
    isLoading: boolean;
    submitEndorsement: () => void;
}
const EndorsingForm = ({
    isPendingEndorser,
    isLoading,
    submitEndorsement,
}: EndorsingFormProps) => {
    const [isReviewed, setReviewed] = useState(false);
    return isPendingEndorser ? (
        <div className="space-y-3">
            <Text className="text-red-500">
                Please review carefully the new member card preview. Make sure
                that all the social handles links are working. Once all the
                endorsements are submitted the new Eden Member Induction will be
                completed and the NFT data will be immutable.
            </Text>
            <Text>
                If any of the new member data is incorrect, ask for the new
                member to fix his/her profile. If the induction video seems
                wrong, please reupload the induction video.
            </Text>
            <Form.Checkbox
                id="reviewed"
                label="I carefully reviewed the New Member data and confirm my endorsement"
                value={Number(isReviewed)}
                onChange={() => setReviewed(!isReviewed)}
            />
            <div className="w-max mx-auto">
                <Button
                    onClick={submitEndorsement}
                    disabled={isLoading || !isReviewed}
                >
                    {isLoading ? "Submitting endorsement..." : "Submit"}
                </Button>
            </div>
        </div>
    ) : (
        <div>
            Waiting for all the endorsements to complete the induction process.
        </div>
    );
};

interface DonationFormProps {
    isInvitee: boolean;
    isLoading: boolean;
    submitDonation: () => void;
}
const DonationForm = ({
    isInvitee,
    isLoading,
    submitDonation,
}: DonationFormProps) => {
    return isInvitee ? (
        <div className="space-y-3">
            <Text>
                This is your last chance to review your profile and make sure
                everything is correct. If you want to proceed, click on the
                below button to donate and complete your induction!
            </Text>
            <div className="w-max mx-auto">
                <Button onClick={submitDonation} disabled={isLoading}>
                    {isLoading
                        ? "Submitting donation..."
                        : `I want to Donate ${assetToString(
                              minimumDonationAmount
                          )}`}
                </Button>
            </div>
        </div>
    ) : (
        <div>
            Please reach out to the invitee and let him know that his induction
            is endorsed and it's only waiting for his donation to complete the
            induction!
        </div>
    );
};
