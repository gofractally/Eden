import dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatus, getInductionStatusLabel } from "inductions/utils";
import { Button, Heading, Link, useFetchedData } from "_app";
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
                <InvitationsForInvitee inductions={inductions} />
            )}
        </div>
    );
};

interface InvitationsForInviteeProps {
    inductions: Induction[];
}

const InvitationsForInvitee = ({ inductions }: InvitationsForInviteeProps) => {
    return (
        <>
            <Heading size={3} className="mb-3">
                My invitations to join Eden
            </Heading>
            <div className={TABLE_CLASS} role="table" aria-label="Invitations">
                <div className={TABLE_HEADER_CLASS} role="rowgroup">
                    <div className="md:flex-1 first" role="columnheader">
                        Inviter
                    </div>
                    <div className="md:flex-1" role="columnheader">
                        Voters
                    </div>
                    <div
                        className="md:flex-1 flex-shrink flex-grow-0"
                        role="columnheader"
                    >
                        Time remaining
                    </div>
                    <div className="md:text-center w-64" role="columnheader">
                        Action/Status
                    </div>
                </div>
                <div className={TABLE_ROWS_CLASS}>
                    {inductions.map((induction) => (
                        <InvitationRowForInvitee
                            induction={induction}
                            key={induction.id}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

const InvitationRowForInvitee = ({ induction }: { induction: Induction }) => {
    const [allEndorsements] = useFetchedData<any>(
        getEndorsementsByInductionId,
        induction.id
    );

    const endorsers = allEndorsements
        ?.map((end: Endorsement): string => end.endorser)
        .filter((end: string) => end !== induction.inviter);

    const remainingTime = dayjs().to(
        dayjs(induction.created_at).add(7, "day"),
        true
    );

    return (
        <div className={`${TABLE_ROW_CLASS} px-4 py-3`} role="rowgroup">
            <div className="md:flex-1 first font-light" role="cell">
                <span className="md:hidden font-semibold">Inviter: </span>
                {induction.inviter}
            </div>
            <div className="md:flex-1 font-light" role="cell">
                <span className="md:hidden font-semibold">Voters: </span>
                {endorsers?.join(", ")}
            </div>
            <div
                className="md:flex-1 flex-shrink flex-grow-0 font-medium"
                role="cell"
            >
                <span className="md:hidden font-semibold">
                    Time remaining:{" "}
                </span>
                {remainingTime}
            </div>
            <div className="md:text-center w-64 pt-4 pb-2 md:py-0" role="cell">
                <InviteeInductionStatus induction={induction} />
            </div>
        </div>
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

const TABLE_CLASS =
    "md:border md:shadow-sm border-gray-200 rounded text-gray-700";
const TABLE_ROWS_CLASS =
    "space-y-5 md:space-y-0 md:divide-y md:divide-gray-200";
const TABLE_ROW_CLASS =
    "md:flex items-center border border-gray-200 shadow-sm md:shadow-none md:border-0 space-y-1 md:space-y-0 rounded md:rounded-none md:h-16 hover:bg-gray-50";
const TABLE_HEADER_CLASS =
    "hidden md:flex items-center px-4 py-3 title-font font-medium text-gray-900 text-sm bg-gray-200";
