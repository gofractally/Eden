import React, { Dispatch, SetStateAction, useState } from "react";
import { useQueryClient } from "react-query";
import { onError, ActionButton, Form, Link, Text, useUALAccount } from "_app";
import { submitEndorsementTransaction } from "inductions";
import { Induction } from "inductions/interfaces";

interface Props {
    induction: Induction;
    setIsReviewingVideo: Dispatch<SetStateAction<boolean>>;
}

export const InviterWitnessEndorsementForm = ({
    induction,
    setIsReviewingVideo,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const queryClient = useQueryClient();
    const [isReviewed, setReviewed] = useState(false);
    const [isLoading, setLoading] = useState(false);

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

            // tolerance time to make sure blockchain processed the transactions
            await new Promise((resolve) => setTimeout(resolve, 6000));

            // refetch induction/endorsements to update endorsements list or go to pending donate screen
            queryClient.invalidateQueries(["induction", induction.id]);
        } catch (error) {
            onError(error, "Unable to submit endorsement");
            setLoading(false);
        }
    };

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
                <Link onClick={() => setIsReviewingVideo(true)}>
                    click here
                </Link>
                . Keep in mind that modifying the induction video will reset any
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
                        isLoading={isLoading}
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};
