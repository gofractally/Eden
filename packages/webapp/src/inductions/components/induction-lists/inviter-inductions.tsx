import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays } from "../../utils";
import { Induction, InductionRole } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";
import { EndorsersNames } from "./induction-names";

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
    return inductions.map((induction) => ({
        key: induction.id,
        invitee: induction.new_member_profile.name || induction.invitee,
        inviter_witnesses: (
            <EndorsersNames
                induction={induction}
                skipEndorser={induction.inviter}
            />
        ),
        time_remaining: getInductionRemainingTimeDays(induction),
        status: (
            <InductionStatusButton
                induction={induction}
                role={InductionRole.Inviter}
            />
        ),
    }));
};
