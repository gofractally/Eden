import { SideNavLayout, CallToAction, useUALAccount } from "_app";
import { InductionsContainer, PendingInvitationsLink } from "inductions";

export const InductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();

    return (
        <SideNavLayout title="Membership" className="flex flex-col">
            {ualAccount ? (
                <InductionsContainer ualAccount={ualAccount} />
            ) : (
                <div className="flex-1 flex flex-col justify-center">
                    <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                        Welcome to Eden. Sign in using your wallet.
                    </CallToAction>
                    <PendingInvitationsLink />
                </div>
            )}
        </SideNavLayout>
    );
};

export default InductionPage;
