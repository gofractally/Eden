import { useState } from "react";

import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    onError,
    useUALAccount,
} from "_app";

import { Induction, InductionStatus } from "../../interfaces";
import { cancelInductionTransaction } from "../../transactions";

interface Props {
    induction: Induction;
    status: InductionStatus;
    canEndorse?: boolean;
    isInvitee?: boolean;
    unknownEndorsements?: boolean;
}

export const InductionStatusButton = ({
    induction,
    status,
    canEndorse,
    isInvitee,
    unknownEndorsements,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [isLoading, setLoading] = useState(false);
    const [isCanceled, setCanceled] = useState(false);

    const cancelInduction = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = cancelInductionTransaction(
                authorizerAccount,
                induction.id
            );
            console.info(transaction);

            setLoading(true);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductcancel trx", signedTrx);

            setCanceled(true);
        } catch (error) {
            onError(error, "Unable to cancel induction");
        }

        setLoading(false);
    };

    if (isCanceled) {
        return <div className="w-full text-center text-red-500">Canceled</div>;
    } else if (status === InductionStatus.Expired) {
        return (
            <ActionButton
                type={ActionButtonType.Danger}
                size={ActionButtonSize.S}
                fullWidth
                isLoading={isLoading}
                onClick={cancelInduction}
            >
                Cancel expired
            </ActionButton>
        );
    }

    let buttonType = ActionButtonType.Disabled;
    let buttonLabel = "";
    switch (status) {
        case InductionStatus.PendingProfile:
            if (isInvitee) {
                buttonType = ActionButtonType.InductionStatusCeremony;
                buttonLabel = "Create my profile";
            } else {
                buttonType = ActionButtonType.Neutral;
                buttonLabel = "Waiting for profile";
            }
            break;
        case InductionStatus.PendingCeremonyVideo:
            if (isInvitee) {
                buttonType = ActionButtonType.Neutral;
                buttonLabel = "Induction ceremony";
            } else {
                buttonType = ActionButtonType.InductionStatusCeremony;
                buttonLabel = "Complete ceremony";
            }
            break;
        case InductionStatus.PendingEndorsement:
            if (canEndorse) {
                buttonType = ActionButtonType.InductionStatusAction;
                buttonLabel = "Review & endorse";
            } else {
                buttonType = ActionButtonType.Neutral;
                buttonLabel = unknownEndorsements
                    ? "Pending completion"
                    : "Pending endorsements";
            }
            break;
        case InductionStatus.PendingDonation:
            if (isInvitee) {
                buttonType = ActionButtonType.InductionStatusAction;
                buttonLabel = "Donate & complete";
            } else {
                buttonType = ActionButtonType.Neutral;
                buttonLabel = "Pending donation";
            }
            break;
        default:
            return <>Error</>;
    }

    return (
        <ActionButton
            size={ActionButtonSize.S}
            fullWidth
            href={`/induction/${induction.id}`}
            type={buttonType}
        >
            {buttonLabel}
        </ActionButton>
    );
};
