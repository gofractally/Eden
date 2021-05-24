import React, { useState } from "react";
import { useQueryClient } from "react-query";

import { onError, ActionButton, Form, useUALAccount } from "_app";
import { submitEndorsementTransaction } from "inductions";

import { Induction } from "inductions/interfaces";

interface Props {
    induction: Induction;
}

export const InductionEndorsementForm = ({ induction }: Props) => {
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
        <div className="mt-4">
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
