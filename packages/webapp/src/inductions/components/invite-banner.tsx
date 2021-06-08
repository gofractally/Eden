import { CallToAction, Button } from "_app";

interface InviteBannerProps {
    canInvite?: boolean;
    asCallToAction: boolean;
}

export const InviteBanner = ({
    canInvite,
    asCallToAction,
}: InviteBannerProps) => {
    if (canInvite && asCallToAction) {
        return (
            <CallToAction buttonLabel="Invite to Eden" href="/induction/init">
                Spread the love! Invite your trusted contacts in the EOS
                community to Eden.
            </CallToAction>
        );
    } else if (canInvite) {
        return (
            <div className="flex items-center justify-center text-center flex-col md:flex-row-reverse md:justify-start mt-4 mb-6">
                <div className="w-44 md:w-56 sm:mx-0 md:mx-4">
                    <Button href="/induction/init" size="sm" fullWidth>
                        Invite to Eden
                    </Button>
                </div>
                <div className="text-sm text-gray-700 w-3/4 md:w-auto mt-2 md:mt-0">
                    Invite your trusted contacts in the EOS community to Eden.
                </div>
            </div>
        );
    }
    return <></>;
};
