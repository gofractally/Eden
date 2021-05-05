import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import {
    getInductionRemainingTimeDays,
    getInductionStatus,
} from "inductions/utils";
import { getInduction } from "inductions/api";
import {
    ActionButton,
    ActionButtonSize,
    ActionButtonType,
    useFetchedData,
    useMemberByAccountName,
} from "_app";
import * as InductionTable from "_app/ui/table";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";

dayjs.extend(relativeTime.default);

interface Props {
    endorsements: Endorsement[];
    isActiveCommunity?: boolean;
}

export const EndorserInductions = ({
    endorsements,
    isActiveCommunity,
}: Props) => (
    <InductionTable.Table
        columns={ENDORSER_INDUCTION_COLUMNS}
        data={getTableData(endorsements)}
        tableHeader={
            isActiveCommunity
                ? "Invitations awaiting my endorsement"
                : "Waiting on the following members"
        }
    />
);

const ENDORSER_INDUCTION_COLUMNS: InductionTable.Column[] = [
    {
        key: "invitee",
        label: "Invitee",
    },
    {
        key: "inviter",
        label: "Inviter",
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

const getTableData = (endorsements: Endorsement[]): InductionTable.Row[] => {
    return endorsements.map((end) => {
        const [induction] = useFetchedData<Induction>(
            getInduction,
            end.induction_id
        );

        const { data: inviter } = useMemberByAccountName(end.inviter);

        const remainingTime = getInductionRemainingTimeDays(induction);

        const invitee =
            induction && induction.new_member_profile.name
                ? induction.new_member_profile.name
                : end.invitee;

        return {
            key: `${end.induction_id}-${end.id}`,
            invitee,
            inviter: inviter ? inviter.name : end.inviter,
            time_remaining: remainingTime,
            status: induction ? (
                <EndorserInductionStatus
                    induction={induction}
                    endorsement={end}
                />
            ) : (
                "Unknown"
            ),
        };
    });
};

interface EndorserInductionStatusProps {
    induction: Induction;
    endorsement: Endorsement;
}

const EndorserInductionStatus = ({
    induction,
    endorsement,
}: EndorserInductionStatusProps) => {
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
            if (endorsement.endorsed) {
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
                    Endorse
                </ActionButton>
            );
        default:
            return <>Error</>;
    }
};
