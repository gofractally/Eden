import { useState } from "react";

import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    onError,
    useFetchedData,
    useMemberListByAccountNames,
    useUALAccount,
} from "_app";
import * as InductionTable from "_app/ui/table";

import { getEndorsementsByInductionId } from "../../api";
import { getInductionRemainingTimeDays, getInductionStatus } from "../../utils";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";
import { cancelInductionTransaction } from "../../transactions";

interface Props {
    inductions: Induction[];
}

export const InviterInductions = ({ inductions }: Props) => (
    <InductionTable.Table
        columns={INVITER_INDUCTION_COLUMNS}
        data={getTableData(inductions)}
        tableHeader="People I'm inviting"
    />
);

const INVITER_INDUCTION_COLUMNS: InductionTable.Column[] = [
    {
        key: "invitee",
        label: "Invitee",
    },
    {
        key: "inviter_witnesses",
        label: "Inviter & Witnesses",
        className: "hidden md:flex",
    },
    {
        key: "time_remaining",
        label: "Time remaining",
        className: "hidden md:flex",
    },
    {
        key: "status",
        label: "Action/Status",
        type: InductionTable.DataTypeEnum.Action,
    },
];

const getTableData = (inductions: Induction[]): InductionTable.Row[] => {
    return inductions.map((ind) => {
        const [allEndorsements] = useFetchedData<any>(
            getEndorsementsByInductionId,
            ind.id
        );

        const endorsersAccounts =
            allEndorsements
                ?.map((end: Endorsement): string => end.endorser)
                .filter((end: string) => end !== ind.inviter) || [];

        const endorsersMembers = useMemberListByAccountNames(endorsersAccounts);

        const endorsers =
            endorsersMembers
                .map(
                    (member, index) =>
                        member.data?.name || endorsersAccounts[index]
                )
                .join(", ") || "";

        const remainingTime = getInductionRemainingTimeDays(ind);

        return {
            key: ind.id,
            invitee: ind.new_member_profile.name || ind.invitee,
            inviter_witnesses: endorsers,
            time_remaining: remainingTime,
            status: (
                <InviterInductionStatus
                    induction={ind}
                    endorsements={allEndorsements}
                />
            ),
        };
    });
};

interface InviterInductionStatusProps {
    induction: Induction;
    endorsements?: Endorsement[];
}

const InviterInductionStatus = ({
    induction,
    endorsements,
}: InviterInductionStatusProps) => {
    const status = getInductionStatus(induction, endorsements);

    const [ualAccount] = useUALAccount();
    const [isLoading, setLoading] = useState(false);
    const [isCanceled, setCanceled] = useState(false);

    // TODO: move it up to work with invitee and endorsers status too
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
    }

    switch (status) {
        case InductionStatus.Expired:
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
        case InductionStatus.PendingProfile:
            return (
                <ActionButton
                    type={ActionButtonType.Neutral}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Waiting for profile
                </ActionButton>
            );
        case InductionStatus.PendingCeremonyVideo:
            return (
                <ActionButton
                    type={ActionButtonType.InductionStatusCeremony}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Complete ceremony
                </ActionButton>
            );
        case InductionStatus.PendingEndorsement:
            const inviterEndorsement = endorsements?.find(
                (end) => end.inviter === induction.inviter
            );
            if (inviterEndorsement?.endorsed) {
                return (
                    <ActionButton
                        type={ActionButtonType.Neutral}
                        size={ActionButtonSize.S}
                        fullWidth
                        href={`/induction/${induction.id}`}
                    >
                        Pending endorsements
                    </ActionButton>
                );
            }
            return (
                <ActionButton
                    type={ActionButtonType.InductionStatusAction}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Review &amp; endorse
                </ActionButton>
            );
        case InductionStatus.PendingDonation:
            return (
                <ActionButton
                    type={ActionButtonType.Neutral}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Pending donation
                </ActionButton>
            );
        default:
            return <>Error</>;
    }
};
