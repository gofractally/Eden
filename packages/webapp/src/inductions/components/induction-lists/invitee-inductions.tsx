import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatus } from "inductions/utils";
import { useFetchedData } from "_app";
import * as InductionTable from "_app/ui/table";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";
import { InductionActionButton } from "./action-button";

dayjs.extend(relativeTime.default);

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
        const [allEndorsements] = useFetchedData<any>(
            getEndorsementsByInductionId,
            ind.id
        );
        const endorsers = allEndorsements
            ?.map((end: Endorsement): string => end.endorser)
            .filter((end: string) => end !== ind.inviter)
            ?.join(", ");
        const remainingTime = dayjs().to(
            dayjs(ind.created_at).add(7, "day"),
            true
        );
        return {
            key: ind.id,
            inviter: ind.inviter,
            voters: endorsers,
            time_remaining: remainingTime,
            status: <InviteeInductionStatus induction={ind} />,
        };
    });
};

const InviteeInductionStatus = ({ induction }: { induction: Induction }) => {
    const status = getInductionStatus(induction);
    switch (status) {
        case InductionStatus.waitingForProfile:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-blue-400 border-blue-400"
                    lightText
                >
                    Create my profile
                </InductionActionButton>
            );
        case InductionStatus.waitingForVideo:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-gray-50"
                >
                    Induction ceremony
                </InductionActionButton>
            );
        case InductionStatus.waitingForEndorsement:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-gray-50"
                >
                    Voting
                </InductionActionButton>
            );
        default:
            return <>Error</>;
    }
};
