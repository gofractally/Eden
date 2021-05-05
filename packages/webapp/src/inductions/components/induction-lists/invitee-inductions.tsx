import dayjs from "dayjs";

import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    useFetchedData,
    useMemberByAccountName,
} from "_app";
import * as InductionTable from "_app/ui/table";

import { getEndorsementsByInductionId } from "../../api";
import { getInductionRemainingTimeDays, getInductionStatus } from "../../utils";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";

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
        key: "voters",
        label: "Voters",
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

        const endorsers =
            allEndorsements
                ?.map((end: Endorsement): string => end.endorser)
                .filter((end: string) => end !== ind.inviter)
                ?.join(", ") || "";

        const isFullyEndorsed =
            allEndorsements &&
            allEndorsements.filter((endorsement) => endorsement.endorsed)
                .length === allEndorsements.length;

        const remainingTime = getInductionRemainingTimeDays(ind);

        return {
            key: ind.id,
            inviter: inviter ? inviter.name : ind.inviter,
            voters: endorsers,
            time_remaining: remainingTime,
            status: (
                <InviteeInductionStatus
                    induction={ind}
                    isFullyEndorsed={isFullyEndorsed}
                />
            ),
        };
    });
};

interface InviteeInductionStatusProps {
    induction: Induction;
    isFullyEndorsed?: boolean;
}
const InviteeInductionStatus = ({
    induction,
    isFullyEndorsed,
}: InviteeInductionStatusProps) => {
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
                    type={ActionButtonType.INDUCTION_STATUS_WAITING}
                    size={ActionButtonSize.S}
                    fullWidth
                    href={`/induction/${induction.id}`}
                >
                    Induction ceremony
                </ActionButton>
            );
        case InductionStatus.waitingForEndorsement:
            return isFullyEndorsed ? (
                <ActionButton
                    href={`/induction/${induction.id}`}
                    type={ActionButtonType.INDUCTION_STATUS_ACTION}
                    size={ActionButtonSize.S}
                    fullWidth
                >
                    Donate & complete
                </ActionButton>
            ) : (
                <ActionButton
                    href={`/induction/${induction.id}`}
                    type={ActionButtonType.INDUCTION_STATUS_WAITING}
                    size={ActionButtonSize.S}
                    fullWidth
                >
                    Pending endorsements
                </ActionButton>
            );
        default:
            return <>Error</>;
    }
};
