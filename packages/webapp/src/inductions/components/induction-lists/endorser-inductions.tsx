import { useQuery } from "react-query";

import {
    queryEndorsementsByInductionId,
    queryInduction,
    useMemberByAccountName,
    useMemberListByAccountNames,
} from "_app";
import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays, getInductionStatus } from "../../utils";
import { Endorsement } from "../../interfaces";
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

const getTableData = (endorsements: Endorsement[]): InductionTable.Row[] => {
    return endorsements.map((endorsement) => {
        const { data: induction } = useQuery(
            queryInduction(endorsement.induction_id)
        );

        const { data: allEndorsements } = useQuery(
            queryEndorsementsByInductionId(endorsement.induction_id)
        );

        const { data: inviter } = useMemberByAccountName(endorsement.inviter);

        const endorsersAccounts =
            allEndorsements
                ?.map(
                    (endorsement: Endorsement): string => endorsement.endorser
                )
                .filter(
                    (endorser: string) =>
                        ![endorsement.inviter, endorsement.endorser].includes(
                            endorser
                        )
                ) || [];

        const endorsersMembers = useMemberListByAccountNames(endorsersAccounts);

        const endorsers =
            endorsersMembers
                .map(
                    (member, index) =>
                        member.data?.name || endorsersAccounts[index]
                )
                .join(", ") || "";

        const inviterName = inviter ? inviter.name : endorsement.inviter;
        const inviterAndWitnesses =
            inviterName + (endorsers ? ", " + endorsers : "");

        const remainingTime = getInductionRemainingTimeDays(induction);

        const invitee =
            induction && induction.new_member_profile.name
                ? induction.new_member_profile.name
                : endorsement.invitee;

        return {
            key: `${endorsement.induction_id}-${endorsement.id}`,
            invitee,
            inviterAndWitnesses,
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
