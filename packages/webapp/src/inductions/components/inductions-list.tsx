import { getEndorsementsByInductionId } from "inductions/api";
import { getInductionStatusLabel } from "inductions/utils";
import { Link, useFetchedData } from "_app";
import { Endorsement, Induction } from "../interfaces";

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
        <div className={TABLE_CLASS} role="table" aria-label="Invitations">
            <div className={`${TABLE_HEADER_CLASS}`} role="rowgroup">
                <div
                    className={`${TABLE_CELL_CLASS} first`}
                    role="columnheader"
                >
                    Inviter
                </div>
                <div className={`${TABLE_CELL_CLASS}`} role="columnheader">
                    Voters
                </div>
                <div className={`${TABLE_CELL_CLASS}`} role="columnheader">
                    Time remaining
                </div>
                <div
                    className={`${TABLE_CELL_CLASS} md:text-center`}
                    role="columnheader"
                >
                    Action/Status
                </div>
            </div>
            {inductions.map((induction) => (
                <InvitationRowForInvitee
                    induction={induction}
                    key={induction.id}
                />
            ))}
        </div>
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

    return (
        <div className={`${TABLE_ROW_CLASS} px-4 py-3`} role="rowgroup">
            <div className={`${TABLE_CELL_CLASS} first`} role="cell">
                {induction.inviter}
            </div>
            <div className={`${TABLE_CELL_CLASS}`} role="cell">
                {endorsers?.join(", ")}
            </div>
            <div className={`${TABLE_CELL_CLASS}`} role="cell">
                {induction.created_at}
            </div>
            <div className={`${TABLE_CELL_CLASS} md:text-center`} role="cell">
                <Link href={`/induction/${induction.id}`}>
                    {getInductionStatusLabel(induction)}
                </Link>
            </div>
        </div>
    );
};

const TABLE_CLASS = "border border-gray-200 rounded";
const TABLE_ROW_CLASS = "md:flex items-center md:h-16";
const TABLE_CELL_CLASS = "md:flex-1";
const TABLE_HEADER_CLASS =
    "md:flex items-center px-4 py-3 title-font font-medium text-gray-900 text-sm bg-gray-200";
