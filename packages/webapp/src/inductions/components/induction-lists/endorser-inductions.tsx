import { useQueries } from "react-query";

import { queryInduction } from "_app";
import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays } from "../../utils";
import { Endorsement, Induction, InductionRole } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";
import { EndorsersNames } from "./endorsers-names";

interface Props {
    endorsements: Endorsement[];
    isActiveCommunity?: boolean;
}

export const EndorserInductions = ({
    endorsements,
    isActiveCommunity,
}: Props) => {
    const inductionsQueries = endorsements.map((endorsement) =>
        queryInduction(endorsement.induction_id)
    );
    const inductions = useQueries(inductionsQueries)
        .filter((query) => query.data)
        .map((query) => query.data) as Induction[];

    return (
        <InductionTable.Table
            columns={ENDORSER_INDUCTION_COLUMNS}
            data={getTableData(endorsements, inductions)}
            tableHeader={
                isActiveCommunity
                    ? "Invitations awaiting my endorsement"
                    : "Waiting on the following members"
            }
        />
    );
};

const ENDORSER_INDUCTION_COLUMNS: InductionTable.Column[] = [
    {
        key: "invitee",
        label: "Invitee",
    },
    {
        key: "inviterAndWitnesses",
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

const getTableData = (
    endorsements: Endorsement[],
    inductions: Induction[]
): InductionTable.Row[] => {
    return endorsements.map((endorsement) => {
        const induction = inductions.find(
            (induction) => induction.id === endorsement.induction_id
        );
        const remainingTime = getInductionRemainingTimeDays(induction);

        const invitee =
            induction && induction.new_member_profile.name
                ? induction.new_member_profile.name
                : endorsement.invitee;

        return {
            key: `${endorsement.induction_id}-${endorsement.id}`,
            invitee,
            inviterAndWitnesses: induction ? (
                <EndorsersNames
                    induction={induction}
                    skipEndorser={endorsement.endorser}
                />
            ) : (
                "Unknown"
            ),
            time_remaining: remainingTime,
            status: induction ? (
                <InductionStatusButton
                    induction={induction}
                    role={InductionRole.Endorser}
                />
            ) : (
                "Unknown"
            ),
        };
    });
};
