import { useState } from "react";
import { FaTrash } from "react-icons/fa";

import { ButtonType, Button, onError, useUALAccount } from "_app";

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
            <Button
                type="danger"
                size="sm"
                fullWidth
                isLoading={isLoading}
                onClick={cancelInduction}
            >
                <FaTrash className="mr-2" />
                Expired
            </Button>
        );
    }

    let buttonType: ButtonType = "disabled";
    let buttonLabel = "";
    switch (status) {
        case InductionStatus.PendingProfile:
            if (isInvitee) {
                buttonType = "inductionStatusCeremony";
                buttonLabel = "Create my profile";
            } else {
                buttonType = "neutral";
                buttonLabel = "Waiting for profile";
            }
            break;
        case InductionStatus.PendingCeremonyVideo:
            if (isInvitee) {
                buttonType = "neutral";
                buttonLabel = "Induction ceremony";
            } else {
                buttonType = "inductionStatusCeremony";
                buttonLabel = "Complete ceremony";
            }
            break;
        case InductionStatus.PendingEndorsement:
            if (canEndorse) {
                buttonType = "inductionStatusAction";
                buttonLabel = "Review & endorse";
            } else {
                buttonType = "neutral";
                buttonLabel = unknownEndorsements
                    ? "Pending completion"
                    : "Pending endorsements";
            }
            break;
        case InductionStatus.PendingDonation:
            if (isInvitee) {
                buttonType = "inductionStatusAction";
                buttonLabel = "Donate & complete";
            } else {
                buttonType = "neutral";
                buttonLabel = "Pending donation";
            }
            break;
        default:
            return <>Error</>;
    }

    return (
        <Button
            size="sm"
            fullWidth
            href={`/induction/${induction.id}`}
            type={buttonType}
        >
            {buttonLabel}
        </Button>
    );
};
