import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatus, getInductionStatusLabel } from "inductions/utils";
import { Button, Heading, Link, useFetchedData } from "_app";
import * as InductionTable from "inductions/components/induction-table";
import { Endorsement, Induction, InductionStatus } from "../interfaces";

dayjs.extend(relativeTime.default);

interface InductionsListProps {
    inductions: Induction[];
    isInviter?: boolean;
}

export const InductionsList = ({
    inductions,
    isInviter,
}: InductionsListProps) => {
    return (
        <div>
            {isInviter ? (
                <ul className="mb-4 space-y-4">
                    {inductions.map((induction) => (
                        <li key={induction.id}>
                            <Link href={`/induction/${induction.id}`}>
                                Invitation sent to ${induction.invitee}
                            </Link>
                            <span className="ml-2 text-red-600 italic">
                                {getInductionStatusLabel(induction)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <InductionsForInvitee inductions={inductions} />
            )}
        </div>
    );
};

interface InductionsForInviteeProps {
    inductions: Induction[];
}

const InductionsForInvitee = ({ inductions }: InductionsForInviteeProps) => {
    const headers: InductionTable.Header[] = [
        {
            key: "inviter",
            label: "Inviter",
        },
        {
            key: "voters",
            label: "Voters",
        },
        {
            key: "time_remaining",
            label: "Time remaining",
        },
        {
            key: "status",
            label: "Action/Status",
            type: InductionTable.DataTypeEnum.Action,
        },
    ];
    const data: InductionTable.Row[] = inductions.map((ind) => {
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

    return (
        <>
            <Heading size={3} className="mb-3">
                My invitations to join Eden
            </Heading>
            <InductionTable.Table headers={headers} data={data} />
        </>
    );
};

const InviteeInductionStatus = ({ induction }: { induction: Induction }) => {
    const status = getInductionStatus(induction);
    switch (status) {
        case InductionStatus.waitingForProfile:
            return (
                <Button href={`/induction/${induction.id}`} color="blue">
                    Create my community profile
                </Button>
            );
        case InductionStatus.waitingForVideo:
            return (
                <Link href={`/induction/${induction.id}`}>
                    Ready for induction ceremony
                </Link>
            );
        case InductionStatus.waitingForEndorsement:
            return <Link href={`/induction/${induction.id}`}>Voting</Link>;
        default:
            return <>Error</>;
    }
};
