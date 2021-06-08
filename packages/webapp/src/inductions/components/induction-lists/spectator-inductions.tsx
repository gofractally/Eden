import { useQuery } from "react-query";

import {
    queryEndorsementsByInductionId,
    useMemberByAccountName,
    useMemberListByAccountNames,
} from "_app";
import * as InductionTable from "_app/ui/table";

import { getInductionRemainingTimeDays } from "../../utils";
import { Endorsement, Induction } from "../../interfaces";
import { InductionStatusButton } from "./induction-status-button";

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
        const { data: allEndorsements } = useQuery(
            queryEndorsementsByInductionId(induction.id)
        );

        const { data: inviter } = useMemberByAccountName(induction.inviter);

        const endorsersAccounts =
            allEndorsements
                ?.map((end: Endorsement): string => end.endorser)
                .filter((end: string) => end !== induction.inviter) || [];

        const endorsersMembers = useMemberListByAccountNames(endorsersAccounts);

        const endorsers =
            endorsersMembers
                .map(
                    (member, index) =>
                        member.data?.name || endorsersAccounts[index]
                )
                .join(", ") || "";

        const remainingTime = getInductionRemainingTimeDays(induction);

        return {
            key: induction.id,
            invitee: induction.new_member_profile?.name || induction.invitee,
            inviter: inviter ? inviter.name : induction.inviter,
            witnesses: endorsers,
            time_remaining: remainingTime,
            status: <InductionStatusButton induction={induction} />,
        };
    });
};
