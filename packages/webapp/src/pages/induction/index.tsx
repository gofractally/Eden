import { SingleColLayout, CallToAction, useUALAccount } from "_app";
import { InductionsContainer } from "inductions";

export const InductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();

    return (
        <SingleColLayout title="Membership">
            {ualAccount ? (
                <InductionsContainer ualAccount={ualAccount} />
            ) : (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
