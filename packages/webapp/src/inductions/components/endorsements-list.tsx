import { Heading, Link, useUALAccount } from "_app";
import { Endorsement } from "../interfaces";

interface EndorsementsListProps {
    endorsements: Endorsement[];
}

export const EndorsementsList = ({ endorsements }: EndorsementsListProps) => {
    const userEndorsements = endorsements.filter(
        (endorsement) => endorsement.inviter !== endorsement.endorser
    );

    return (
        <div>
            <Heading size={2} className="mt-8">
                Endorsements
            </Heading>
            {userEndorsements.length ? (
                <>
                    <ul className="mt-4 mb-4 space-y-4">
                        {userEndorsements.map((endorsement) => (
                            <li key={endorsement.id}>
                                <Link
                                    href={`/induction/${endorsement.induction_id}`}
                                >
                                    {endorsement.invitee} invited by{" "}
                                    {endorsement.inviter}
                                </Link>
                                {endorsement.endorsed ? (
                                    <span className="ml-2 text-green-600 italic">
                                        ✅ &nbsp; Endorsed
                                    </span>
                                ) : (
                                    <span className="ml-2 text-red-600 italic">
                                        🟡 &nbsp; Pending
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    Total Pending Endorsements: {userEndorsements.length}
                </>
            ) : (
                "You have no pending endorsements."
            )}
        </div>
    );
};
