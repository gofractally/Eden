import { useState } from "react";

import { Text, Link } from "_app";
import { initializeInductionTransaction } from "../transactions";
import { InitInductionForm } from "./init-induction-form";

interface Props {
    ualAccount: any;
}

export const InitInduction = ({ ualAccount }: Props) => {
    const [initializedInductionId, setInitializedInductionId] = useState("");

    const submitTransaction = async (newInduction: any) => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const {
                id,
                transaction,
            } = initializeInductionTransaction(
                authorizerAccount,
                newInduction.invitee,
                [newInduction.witness1, newInduction.witness2]
            );
            console.info(transaction);
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductinit trx", signedTrx);
            setInitializedInductionId(id);
        } catch (error) {
            alert(
                "Error while initializing the induction process: " +
                    JSON.stringify(error)
            );
        }
    };

    return (
        <>
            {initializedInductionId ? (
                <>
                    <Text className="text-green-600 font-bold mb-4">
                        The following induction process was created
                        successfully:
                    </Text>
                    <div className="m-8 p-8 max-w rounded-xl border border-gray-300 shadow-md bg-gray-50 text-5xl text-center">
                        {initializedInductionId}
                    </div>
                    <Text className="mb-4">
                        Please copy and share this link with your invitee and
                        witnesses:{" "}
                        <Link href={`/induction/${initializedInductionId}`}>
                            {window.location.hostname}/induction/
                            {initializedInductionId}
                        </Link>
                    </Text>
                    <Text className="mb-4 text-red-500 italic">
                        You have 7 days to complete this induction otherwise it
                        will expire.
                    </Text>
                </>
            ) : (
                <InitInductionForm onSubmit={submitTransaction} />
            )}
        </>
    );
};
