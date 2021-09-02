import { useMemberByAccountName } from "_app";
import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays } from "../../utils";
import { Induction, InductionRole } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";
import { AccountName, EndorsersNames } from "./induction-names";

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
        label: "Action/status",
        type: InductionTable.DataTypeEnum.Action,
    },
];

const getTableData = (inductions: Induction[]): InductionTable.Row[] => {
    return inductions.map((induction) => ({
        key: induction.id,
        inviter: <AccountName account={induction.inviter} />,
        witnesses: (
            <EndorsersNames
                induction={induction}
                skipEndorser={induction.inviter}
            />
        ),
        time_remaining: getInductionRemainingTimeDays(induction),
        status: (
            <InductionStatusButton
                induction={induction}
                role={InductionRole.Invitee}
            />
        ),
    }));
};
