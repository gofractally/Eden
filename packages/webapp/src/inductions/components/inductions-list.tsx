import { getInductionStatusLabel } from "inductions/utils";
import { Link } from "_app";
import { InviteeInductions } from "./induction-lists";
import { Induction } from "../interfaces";

interface Props {
    inductions: Induction[];
    isInviter?: boolean;
}

export const InductionsList = ({ inductions, isInviter }: Props) => {
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
                <InviteeInductions inductions={inductions} />
            )}
        </div>
    );
};
