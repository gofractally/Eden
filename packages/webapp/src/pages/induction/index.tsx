import {
    SingleColLayout,
    CallToAction,
    Card,
    useFetchedData,
    useUALAccount,
    getIsCommunityActive,
    ActionButton,
    ActionButtonSize,
    useCurrentMember,
} from "_app";
import {
    Endorsement,
    PendingInductions,
    getCurrentInductions,
} from "inductions";
import { MemberStatus } from "members";

export const InductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();

    const [
        isActiveCommunity,
        isLoadingCommunityState,
    ] = useFetchedData<boolean>(getIsCommunityActive);

    const {
        data: edenMember,
        isLoading: isLoadingEdenMember,
    } = useCurrentMember();

    const isActiveMember = edenMember?.status === MemberStatus.ActiveMember;

    const [currentInductions, isLoadingInductions] = useFetchedData<any>(
        getCurrentInductions,
        ualAccount?.accountName,
        isActiveMember
    );

    const isLoading =
        isLoadingEdenMember || isLoadingInductions || isLoadingCommunityState;

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
                    {!isActiveCommunity && <GenesisBanner />}
                    <InviteBanner
                        canInvite={isActiveCommunity && isActiveMember}
                        asCallToAction={!thereAreRecords}
                    />
                    <PendingInductions
                        inductions={inductions}
                        endorsements={userEndorsements}
                        isActiveCommunity={isActiveCommunity}
                        isActiveMember={isActiveMember}
                    />
                </>
            ) : (
                <CallToAction buttonLabel="Get started" href="#">
                    Ready to join Eden? The membership process begins with an
                    invitation. Reach out to a current member to get yours!
                </CallToAction>
            )}
        </SingleColLayout>
    );
};

const GenesisBanner = () => (
    <CallToAction>
        The Genesis group is being inducted. As soon as everyone has completed
        their profiles and donations, the community will be activated and you
        will be able to invite others.
    </CallToAction>
);

interface InviteBannerProps {
    canInvite?: boolean;
    asCallToAction: boolean;
}

const InviteBanner = ({ canInvite, asCallToAction }: InviteBannerProps) => {
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
                    <ActionButton
                        href="/induction/init"
                        size={ActionButtonSize.S}
                        fullWidth
                    >
                        Invite to Eden
                    </ActionButton>
                </div>
                <div className="text-sm text-gray-700 w-3/4 md:w-auto mt-2 md:mt-0">
                    Invite your trusted contacts in the EOS community to Eden.
                </div>
            </div>
        );
    }
    return <></>;
};

export default InductionPage;
