import { useQuery } from "react-query";

import {
    CallToAction,
    useCurrentMember,
    useIsCommunityActive,
    LoadingCard,
    queryCurrentInductions,
    MemberStatus,
} from "_app";
import { EdenMember } from "members";

import { Endorsement } from "../interfaces";
import { PendingInductions } from "./pending-inductions";
import { GetAnInviteCTA } from "./get-an-invite-cta";
import { InviteBanner } from "./invite-banner";

interface InductionsContainerProps {
    ualAccount: any;
}
export const InductionsContainer = ({
    ualAccount,
}: InductionsContainerProps) => {
    const {
        data: isActiveCommunity,
        isLoading: isLoadingCommunityState,
    } = useIsCommunityActive();

    const {
        data: edenMember,
        isLoading: isLoadingEdenMember,
    } = useCurrentMember();

    if (isLoadingCommunityState || isLoadingEdenMember) {
        return <LoadingCard />;
    } else if (!edenMember) {
        return <GetAnInviteCTA />;
    } else {
        return (
            <MemberInductionsContainer
                ualAccount={ualAccount}
                edenMember={edenMember}
                isActiveCommunity={isActiveCommunity}
            />
        );
    }
};

interface MemberInductionsContainerProps {
    ualAccount: any;
    edenMember: EdenMember;
    isActiveCommunity?: boolean;
}
const MemberInductionsContainer = ({
    ualAccount,
    edenMember,
    isActiveCommunity,
}: MemberInductionsContainerProps) => {
    const isActiveMember = edenMember.status === MemberStatus.ActiveMember;

    const { data: currentInductions, isLoading } = useQuery(
        queryCurrentInductions(ualAccount.accountName, isActiveMember)
    );

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

    return isLoading ? (
        <LoadingCard />
    ) : (
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
    );
};

const GenesisBanner = () => (
    <CallToAction>
        The Genesis group is being inducted. As soon as everyone has completed
        their profiles and donations, the community will be activated and you
        will be able to invite others.
    </CallToAction>
);
