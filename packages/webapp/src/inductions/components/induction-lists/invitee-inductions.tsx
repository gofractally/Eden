import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    useFetchedData,
    useMemberByAccountName,
    useMemberListByAccountNames,
} from "_app";
import * as InductionTable from "_app/ui/table";

import {
    getEndorsementsByInductionId,
    getInductionRemainingTimeDays,
    getInductionStatus,
} from "inductions";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";

interface Props {
    inductions: Induction[];
}

export const InviteeInductions = ({ inductions }: Props) => (
    <InductionTable.Table
        columns={INVITEE_INDUCTION_COLUMNS}
        data={getTableData(inductions)}
        tableHeader="My invitations to Eden"
    />
);

const INVITEE_INDUCTION_COLUMNS: InductionTable.Column[] = [
    {
        key: "inviter",
        label: "Inviter",
    },
    {
        key: "witnesses",
        label: "Witnesses",
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
        const [allEndorsements] = useFetchedData<Endorsement[]>(
            getEndorsementsByInductionId,
            ind.id
        );

        const { data: inviter } = useMemberByAccountName(ind.inviter);

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
            inviter: inviter ? inviter.name : ind.inviter,
            witnesses: endorsers,
            time_remaining: remainingTime,
            status: (
                <InviteeInductionStatus
                    induction={ind}
                    endorsements={allEndorsements}
                />
            ),
        };
    });
};

interface InviteeInductionStatusProps {
    endorsements?: Endorsement[];
    induction: Induction;
}
const InviteeInductionStatus = ({
    endorsements,
    induction,
}: InviteeInductionStatusProps) => {
    const status = getInductionStatus(induction, endorsements);
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
                    type={ActionButtonType.INDUCTION_STATUS_PROFILE}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Create my profile
                </ActionButton>
            );
        case InductionStatus.waitingForVideo:
            return (
                <ActionButton
                    type={ActionButtonType.NEUTRAL}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Induction ceremony
                </ActionButton>
            );
        case InductionStatus.waitingForEndorsement:
            return (
                <ActionButton
                    href={`/induction/${induction.id}`}
                    type={ActionButtonType.NEUTRAL}
                    size={ActionButtonSize.S}
                    fullWidth
                >
                    Pending endorsements
                </ActionButton>
            );
        case InductionStatus.waitingForDonation:
            return (
                <ActionButton
                    href={`/induction/${induction.id}`}
                    type={ActionButtonType.INDUCTION_STATUS_ACTION}
                    size={ActionButtonSize.S}
                    fullWidth
                >
                    Donate & complete
                </ActionButton>
            );
        default:
            return <>Error</>;
    }
};
