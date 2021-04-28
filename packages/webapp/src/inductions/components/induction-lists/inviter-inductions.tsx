import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatus } from "inductions/utils";
import { useFetchedData } from "_app";
import * as InductionTable from "inductions/components/induction-lists/induction-table";
import { Endorsement, Induction, InductionStatus } from "../../interfaces";
import { InductionActionButton } from "./action-button";

dayjs.extend(relativeTime.default);

interface Props {
    inductions: Induction[];
}

export const InviterInductions = ({ inductions }: Props) => (
    <InductionTable.Table
        columns={INVITER_INDUCTION_COLUMNS}
        data={getTableData(inductions)}
        tableHeader="My invitations to Eden"
    />
);

const INVITER_INDUCTION_COLUMNS: InductionTable.Column[] = [
    {
        key: "invitee",
        label: "Invitee",
    },
    {
        key: "inviter_voters",
        label: "Inviter & Voters",
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

        console.log("ALL_ENDORSEMENTS");
        console.log(allEndorsements);

        return {
            key: ind.id,
            invitee: ind.invitee,
            inviter_voters: endorsers,
            time_remaining: remainingTime,
            status: (
                <InviterInductionStatus
                    induction={ind}
                    endorsements={allEndorsements}
                />
            ),
        };
    });
};

interface InviterInductionStatusProps {
    induction: Induction;
    endorsements: Endorsement[];
}

const InviterInductionStatus = ({
    induction,
    endorsements,
}: InviterInductionStatusProps) => {
    const status = getInductionStatus(induction, endorsements);
    switch (status) {
        case InductionStatus.waitingForProfile:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-gray-50"
                >
                    Waiting for profile
                </InductionActionButton>
            );
        case InductionStatus.waitingForVideo:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-blue-500 border-blue-500"
                    lightText
                >
                    Complete ceremony
                </InductionActionButton>
            );
        case InductionStatus.waitingForUserToEndorse:
            return (
                <InductionActionButton
                    href={`/induction/${induction.id}`}
                    className="bg-green-500"
                    lightText
                >
                    Vote now
                </InductionActionButton>
            );
        case InductionStatus.waitingForOtherEndorsement:
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
