import { useFetchedData, useMemberByAccountName } from "_app";
import * as InductionTable from "_app/ui/table";

import { getInduction } from "../../api";
import { getInductionRemainingTimeDays, getInductionStatus } from "../../utils";
import { Endorsement, Induction } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";

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
    return endorsements.map((endorsement) => {
        const [induction] = useFetchedData<Induction>(
            getInduction,
            endorsement.induction_id
        );

        const { data: inviter } = useMemberByAccountName(endorsement.inviter);

        const remainingTime = getInductionRemainingTimeDays(induction);

        const invitee =
            induction && induction.new_member_profile.name
                ? induction.new_member_profile.name
                : endorsement.invitee;

        return {
            key: `${endorsement.induction_id}-${endorsement.id}`,
            invitee,
            inviter: inviter ? inviter.name : endorsement.inviter,
            time_remaining: remainingTime,
            status: induction ? (
                <InductionStatusButton
                    induction={induction}
                    status={getInductionStatus(induction)}
                    canEndorse={!endorsement.endorsed}
                    unknownEndorsements
                />
            ) : (
                "Unknown"
            ),
        };
    });
};
