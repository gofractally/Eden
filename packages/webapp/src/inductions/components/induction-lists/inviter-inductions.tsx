import { getEndorsementsByInductionId } from "inductions/api";
import {
    getInductionRemainingTimeDays,
    getInductionStatus,
} from "inductions/utils";
import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    useFetchedData,
    useMemberListByAccountNames,
} from "_app";
import * as InductionTable from "_app/ui/table";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";

interface Props {
    inductions: Induction[];
}

export const InviterInductions = ({ inductions }: Props) => (
    <InductionTable.Table
        columns={INVITER_INDUCTION_COLUMNS}
        data={getTableData(inductions)}
        tableHeader="My outstanding invitations"
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
    const status = getInductionStatus(induction);
    switch (status) {
        case InductionStatus.expired:
            return (
                <ActionButton
                    type={ActionButtonType.DISABLED}
                    size={ActionButtonSize.S}
                    fullWidth
                    disabled
                >
                    Expired
                </ActionButton>
            );
        case InductionStatus.waitingForProfile:
            return (
                <ActionButton
                    type={ActionButtonType.INDUCTION_STATUS_WAITING}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Waiting for profile
                </ActionButton>
            );
        case InductionStatus.waitingForVideo:
            return (
                <ActionButton
                    type={ActionButtonType.INDUCTION_STATUS_CEREMONY}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Complete ceremony
                </ActionButton>
            );
        case InductionStatus.waitingForEndorsement:
            const inviterEndorsement = endorsements?.find(
                (end) => end.inviter === induction.inviter
            );
            if (inviterEndorsement?.endorsed) {
                return (
                    <ActionButton
                        type={ActionButtonType.INDUCTION_STATUS_WAITING}
                        size={ActionButtonSize.S}
                        fullWidth
                        href={`/induction/${induction.id}`}
                    >
                        Pending completion
                    </ActionButton>
                );
            }
            return (
                <ActionButton
                    type={ActionButtonType.INDUCTION_STATUS_ACTION}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Review &amp; Endorse
                </ActionButton>
            );
        default:
            return <>Error</>;
    }
};
