import {
    CallToAction,
    Card,
    SingleColLayout,
    useFetchedData,
    useUALAccount,
} from "_app";
import { EdenMember, getEdenMember, MemberStatus } from "members";
import { InitInduction } from "inductions";

export const InitInductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const [edenMember, isLoading] = useFetchedData<EdenMember>(
        getEdenMember,
        ualAccount?.accountName
    );

    const renderContents = () => {
        if (!ualAccount) {
            return (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            );
        }

        if (isLoading) {
            return <Card title="Loading...">...</Card>;
        }

        if (!edenMember || edenMember.status !== MemberStatus.ActiveMember) {
            return (
                <CallToAction buttonLabel="Get started" href="#">
                    Ready to join Eden? The membership process begins with an
                    invitation. Reach out to a current member to get yours!
                </CallToAction>
            );
        }

        return (
            <Card title="Induction">
                <InitInduction ualAccount={ualAccount} />
            </Card>
        );
    };

    return <SingleColLayout>{renderContents()}</SingleColLayout>;
};

export default InitInductionPage;
