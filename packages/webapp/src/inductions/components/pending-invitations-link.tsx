import { useIsCommunityActive, Link } from "_app";

import { ROUTES } from "_app/config";

export const PendingInvitationsLink = () => {
    const { data: isCommunityActive } = useIsCommunityActive();
    if (!isCommunityActive) return null;
    return (
        <Link
            href={`${ROUTES.INDUCTION.href}/pending-invitations`}
            className="block w-full my-4 text-center"
        >
            <span className="text-gray-400">
                See all pending community invitations
            </span>
        </Link>
    );
};

export default PendingInvitationsLink;
