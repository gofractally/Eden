import {
    SingleColLayout,
    CallToAction,
    Card,
    useFetchedData,
    useUALAccount,
} from "_app";
import {
    Endorsement,
    PendingInductions,
    getCurrentInductions,
} from "inductions";
import { getEdenMember, MemberStatus, EdenMember } from "members";

export const InductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const [edenMember, isLoadingEdenMember] = useFetchedData<EdenMember>(
        getEdenMember,
        ualAccount?.accountName
    );

    const isActiveMember =
        edenMember && edenMember.status === MemberStatus.ActiveMember;

    const [currentInductions, isLoadingInductions] = useFetchedData<any>(
        getCurrentInductions,
        ualAccount?.accountName,
        isActiveMember
    );

    const isLoading = isLoadingEdenMember || isLoadingInductions;

    const inductions = currentInductions ? currentInductions.inductions : [];
    const endorsements = currentInductions
        ? currentInductions.endorsements
        : [];

    const userEndorsements: Endorsement[] = endorsements.filter(
        (end: Endorsement) => end.inviter !== end.endorser
    );

    const thereAreEndorsements = userEndorsements.length > 0;
    const thereAreInductions = inductions.length > 0;
    const thereAreRecords = thereAreInductions || thereAreEndorsements;

    return (
        <SingleColLayout>
            {!ualAccount ? (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            ) : isLoading ? (
                <Card title="Loading...">...</Card>
            ) : edenMember ? (
                <>
                    {isActiveMember && !thereAreRecords && (
                        <CallToAction
                            buttonLabel="Invite to Eden"
                            href="/induction/init"
                        >
                            Spread the love! Invite your trusted contacts in the
                            EOS community to Eden.
                        </CallToAction>
                    )}
                    <PendingInductions
                        inductions={inductions}
                        endorsements={userEndorsements}
                        isActive={isActiveMember}
                    />
                </>
            ) : (
                <CallToAction buttonLabel="Get started" href="#">
                    Looking to join Eden? The membership process begins with an
                    invitation. Reach out to a current member to get yours!
                </CallToAction>
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
