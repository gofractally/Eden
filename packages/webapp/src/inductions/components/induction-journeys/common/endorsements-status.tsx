import { Link, URL_PATHS, useMemberListByAccountNames } from "_app";
import { Endorsement } from "inductions/interfaces";

export const EndorsementsStatus = ({
    endorsements,
}: {
    endorsements: Endorsement[];
}) => {
    const endorsersMembers = useMemberListByAccountNames(
        endorsements.map((e) => e.endorser)
    );

    const getEndorserName = (endorsement: Endorsement) => {
        const endorserMember = endorsersMembers.find(
            (query) => query.data?.account === endorsement.endorser
        );
        return endorserMember?.data?.name || endorsement.endorser;
    };

    const getEndorserStatus = (endorsement: Endorsement) =>
        endorsement.endorsed ? (
            <span title="Endorsement Submitted" className="mr-2">
                ✅
            </span>
        ) : (
            <span title="Pending Endorsement" className="mr-2">
                🟡
            </span>
        );

    return (
        <ul className="mb-4 ml-2">
            {endorsements.map((endorser) => (
                <li key={endorser.id}>
                    {getEndorserStatus(endorser)}{" "}
                    <Link
                        href={`${URL_PATHS.MEMBERS.href}/${endorser.endorser}`}
                    >
                        <span className="text-gray-800 hover:underline">
                            {getEndorserName(endorser)}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
};
