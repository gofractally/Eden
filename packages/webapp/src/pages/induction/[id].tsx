import React, { useMemo } from "react";
import { useRouter } from "next/router";

import {
    CallToAction,
    Card,
    RawLayout,
    SingleColLayout,
    useIsCommunityActive,
} from "_app";
import {
    getInductionStatus,
    InductionRole,
    InductionStatus,
    InviteeJourney,
    InviterWitnessJourney,
    ThirdPartyJourney,
    useGetInductionWithEndorsements,
    useInductionUserRole,
} from "inductions";

export const InductionDetailsPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    const { isLoading: isLoadingCommunityState } = useIsCommunityActive();

    const {
        data,
        isLoading: isLoadingEndorsements,
    } = useGetInductionWithEndorsements(inductionId as string);

    const isLoading = isLoadingEndorsements || isLoadingCommunityState;

    const induction = data?.induction;
    const endorsements = data?.endorsements || [];

    const userRole = useInductionUserRole(endorsements, induction);
    const status = getInductionStatus(induction, endorsements);

    const renderInductionJourney = useMemo(() => {
        if (!induction) return "";
        switch (userRole) {
            case InductionRole.Inviter:
            case InductionRole.Endorser:
                return (
                    <InviterWitnessJourney
                        endorsements={endorsements}
                        induction={induction}
                        inductionStatus={status}
                    />
                );
            case InductionRole.Invitee:
                return (
                    <InviteeJourney
                        endorsements={endorsements}
                        induction={induction}
                        inductionStatus={status}
                    />
                );
            default:
                return (
                    <ThirdPartyJourney
                        endorsements={endorsements}
                        induction={induction}
                        inductionStatus={status}
                    />
                );
        }
    }, [induction, endorsements, status, userRole]);

    if (
        !isLoading &&
        (status === InductionStatus.Invalid ||
            status === InductionStatus.Expired)
    ) {
        return (
            <RawLayout title="Invite not found">
                <CallToAction
                    href="/induction"
                    buttonLabel="Membership Dashboard"
                >
                    Hmmm... this invitation couldn't be found. The invitee may
                    have already been inducted, or their invitation could have
                    expired.
                </CallToAction>
            </RawLayout>
        );
    }

    return (
        <SingleColLayout
            title={isLoading ? "Loading" : `Induction #${inductionId}`}
        >
            {isLoading ? (
                <Card title="Loading...">...</Card>
            ) : (
                renderInductionJourney
            )}
        </SingleColLayout>
    );
};

export default InductionDetailsPage;
