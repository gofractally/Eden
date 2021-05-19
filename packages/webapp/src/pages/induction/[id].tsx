import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";

import {
    CallToAction,
    RawLayout,
    SingleColLayout,
    useGetInductionWithEndorsements,
    useIsCommunityActive,
} from "_app";
import {
    InductionStepEndorsement,
    InductionStepProfile,
    InductionStepVideo,
    InductionStatus,
    getInductionStatus,
    useInductionUserRole,
    InductionRole,
    ThirdPartyJourney,
    InviteeJourney,
    InviterWitnessJourney,
} from "inductions";

// TODO: Finish building this out and switch to using it.
export const InductionDetailsPage2 = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    const [reviewStep, setReviewStep] = useState<
        "profile" | "video" | undefined
    >();

    const {
        data: isCommunityActive,
        isLoading: isLoadingCommunityState,
    } = useIsCommunityActive();

    const {
        data,
        isLoading: isLoadingEndorsements,
    } = useGetInductionWithEndorsements(inductionId as string);

    const induction = data?.induction;
    const endorsements = data?.endorsements ?? [];

    if (isLoadingEndorsements || isLoadingCommunityState) {
        return <p>Loading Induction...</p>;
    }
    const status = getInductionStatus(induction);

    if (
        status === InductionStatus.invalid ||
        status === InductionStatus.expired
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

    const userRole = useInductionUserRole(endorsements, induction);

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
            case InductionRole.Member:
            case InductionRole.Unknown:
            case InductionRole.Unauthenticated:
                return (
                    <ThirdPartyJourney
                        endorsements={endorsements}
                        induction={induction}
                        inductionStatus={status}
                    />
                );
        }
    }, []);

    return (
        <SingleColLayout title={`Induction #${inductionId}`}>
            {renderInductionJourney}
        </SingleColLayout>
    );
};

export const InductionDetailsPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    const [reviewStep, setReviewStep] = useState<
        "profile" | "video" | undefined
    >();

    const {
        data: isCommunityActive,
        isLoading: isLoadingCommunityState,
    } = useIsCommunityActive();

    const {
        data,
        isLoading: isLoadingEndorsements,
    } = useGetInductionWithEndorsements(inductionId as string);
    const induction = data?.induction;
    const endorsements = data?.endorsements ?? [];

    const userRole = useInductionUserRole(endorsements, induction);
    const status = getInductionStatus(induction);

    const renderInductionStep = useMemo(() => {
        if (!induction) return "";

        if (reviewStep === "profile") {
            return (
                <InductionStepProfile
                    induction={induction}
                    isCommunityActive={isCommunityActive}
                    role={userRole}
                    isReviewing
                />
            );
        }

        if (reviewStep === "video") {
            return (
                <InductionStepVideo
                    induction={induction}
                    isReviewing
                    role={userRole}
                />
            );
        }

        switch (status) {
            case InductionStatus.waitingForProfile:
                return (
                    <InductionStepProfile
                        induction={induction}
                        role={userRole}
                        isCommunityActive={isCommunityActive}
                    />
                );
            case InductionStatus.waitingForVideo:
                return (
                    <InductionStepVideo induction={induction} role={userRole} />
                );
            case InductionStatus.waitingForEndorsement:
                return (
                    <InductionStepEndorsement
                        induction={induction}
                        endorsements={endorsements}
                        isCommunityActive={isCommunityActive}
                        setReviewStep={setReviewStep}
                    />
                );
            default:
                return "";
        }
    }, [induction, isCommunityActive, endorsements, reviewStep]);

    return isLoadingEndorsements || isLoadingCommunityState ? (
        <p>Loading Induction...</p>
    ) : status === InductionStatus.invalid ? (
        <RawLayout title="Invite not found">
            <CallToAction href="/induction" buttonLabel="Membership Dashboard">
                Hmmm... this invitation couldn't be found. The invitee may have
                already been inducted, or their invitation could have expired.
            </CallToAction>
        </RawLayout>
    ) : (
        <SingleColLayout title={`Induction #${inductionId}`}>
            {renderInductionStep}
        </SingleColLayout>
    );
};

export default InductionDetailsPage;
