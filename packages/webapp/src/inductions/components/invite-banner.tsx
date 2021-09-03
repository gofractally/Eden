import { CallToAction } from "_app";
import { ROUTES } from "_app/config";

interface InviteBannerProps {
    canInvite?: boolean;
}

export const InviteBanner = ({ canInvite }: InviteBannerProps) => {
    if (!canInvite) return null;
    return (
        <CallToAction
            buttonLabel="Invite to Eden"
            href={`${ROUTES.INDUCTION.href}/init`}
        >
            Spread the love! Invite your trusted contacts in the EOS community
            to Eden.
        </CallToAction>
    );
};
