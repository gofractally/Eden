import { getInductionStatusLabel } from "inductions/utils";
import { Link } from "_app";
import { Induction } from "../interfaces";

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
            <ul className="mb-4 space-y-4">
                {inductions.map((induction) => (
                    <li key={induction.id}>
                        <Link href={`/induction/${induction.id}`}>
                            {isInviter
                                ? `Invitation sent to ${induction.invitee} `
                                : `You were Invited by ${induction.inviter} `}
                        </Link>
                        <span className="ml-2 text-red-600 italic">
                            {getInductionStatusLabel(induction)}
                        </span>
                    </li>
                ))}
            </ul>
            Total Inductions: {inductions.length}
        </div>
    );
};
