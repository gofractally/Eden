import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays } from "../../utils";
import { Induction } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";
import { AccountName, EndorsersNames } from "./induction-names";

interface Props {
    inductions: Induction[];
}

export const SpectatorInductions = ({ inductions }: Props) => (
    <InductionTable.Table
        columns={SPECTATOR_COLUMNS}
        data={getTableData(inductions)}
        tableHeader="Global Pending Invitations to Eden"
    />
);

const SPECTATOR_COLUMNS: InductionTable.Column[] = [
    {
        key: "invitee",
        label: "Invitee",
    },
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
    return inductions.map((induction) => {
        return {
            key: induction.id,
            invitee: induction.new_member_profile?.name || induction.invitee,
            inviter: <AccountName account={induction.inviter} />,
            witnesses: (
                <EndorsersNames
                    induction={induction}
                    skipEndorser={induction.inviter}
                />
            ),
            time_remaining: getInductionRemainingTimeDays(induction),
            status: <InductionStatusButton induction={induction} />,
        };
    });
};
