import { ROUTES } from "_app/config";
import { Text, Link } from "_app/ui";
import { useInductionParticipants } from "inductions/hooks";

export const InductionNames = ({
    inductionId,
    className,
}: {
    inductionId: string;
    className?: string;
}) => {
    const inductionMembers = useInductionParticipants(inductionId);
    const { inviter, endorsers } = inductionMembers;
    return (
        <section className={`space-y-1 ${className}`}>
            {inviter?.name && (
                <Text>
                    <span className="font-medium">Inviter:</span>{" "}
                    <Link href={`${ROUTES.MEMBERS.href}/${inviter.account}`}>
                        {inviter.name}
                    </Link>
                </Text>
            )}
            {endorsers.length && (
                <Text>
                    <span className="font-medium">Witnesses:</span>{" "}
                    {endorsers.map((member, index) => (
                        <span key={`endorser-${member.account}`}>
                            <Link
                                href={`${ROUTES.MEMBERS.href}/${member.account}`}
                            >
                                {member!.name}
                            </Link>
                            {index < endorsers.length - 1 ? ", " : ""}
                        </span>
                    ))}
                </Text>
            )}
        </section>
    );
};
