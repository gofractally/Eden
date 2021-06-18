import {
    SingleColLayout,
    CallToAction,
    useUALAccount,
    useIsCommunityActive,
    Link,
} from "_app";

import { InductionsContainer } from "inductions";

export const InductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const { data: isCommunityActive } = useIsCommunityActive();

    return (
        <SingleColLayout title="Membership">
            {ualAccount ? (
                <InductionsContainer ualAccount={ualAccount} />
            ) : (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            )}
            { isCommunityActive && (
                <Link href="/induction/pending-invitations" className="block w-full my-8 text-center" >
                    <span className="text-gray-400">
                        See all pending community invitations.
                    </span>
                </Link>
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
