import { CallToAction } from "_app";
import { ROUTES } from "_app/routes";

interface InviteBannerProps {
    canInvite?: boolean;
}

export const InviteBanner = ({ canInvite }: InviteBannerProps) => {
    if (!canInvite) return null;
    return (
        <CallToAction
            buttonLabel="Invite to Eden"
            dataTestId="invite-button"
            href={`${ROUTES.INDUCTION.href}/init`}
        >
            Spread the love! Invite your trusted contacts in the EOS community
            to Eden.
        </CallToAction>
    );
};
