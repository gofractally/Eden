import React, { useState } from "react";
import {
    Text,
    Link,
    onError,
    Heading,
    ActionButton,
    ActionButtonSize,
} from "_app";

import { initializeInductionTransaction } from "../../../transactions";
import { InductionStepsContainer } from "inductions";
import { InductionInviteForm } from ".";
import { InductionStepInviter } from "../common";

interface Props {
    ualAccount: any;
}

export const InductionInviteFormContainer = ({ ualAccount }: Props) => {
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
            onError(error, "Unable to initialize the induction process");
        }
    };

    return (
        <InductionStepsContainer
            step={
                initializedInductionId
                    ? InductionStepInviter.PendingProfile
                    : InductionStepInviter.CreateInvite
            }
        >
            {initializedInductionId ? (
                <InviteConfirmation inductionId={initializedInductionId} />
            ) : (
                <>
                    <Heading size={1} className="mb-8">
                        Invite to Eden
                    </Heading>
                    <InductionInviteForm onSubmit={submitTransaction} />
                </>
            )}
        </InductionStepsContainer>
    );
};

const InviteConfirmation = ({ inductionId }: { inductionId: string }) => (
    <>
        <Heading size={1} className="mb-5">
            Success!
        </Heading>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                Now it's your invitee's turn to create their Eden profile.
            </Text>
            <Text className="leading-normal">
                Your invitee and witnesses will now see this pending invitation
                in the Membership dashboard if they sign in with their
                blockchain account. Or you can share this direct link with them:
            </Text>
            <Text className="leading-normal break-all">
                <Link href={`/induction/${inductionId}`}>
                    {window.location.hostname}/induction/
                    {inductionId}
                </Link>
            </Text>
            <Text className="leading-normal">
                This induction process must be completed{" "}
                <span className="underline font-medium">within 7 days</span>. If
                this invitation expires, you will be able to issue another.
            </Text>
        </div>
        <ActionButton href="/induction" size={ActionButtonSize.L}>
            See your invitations
        </ActionButton>
    </>
);
