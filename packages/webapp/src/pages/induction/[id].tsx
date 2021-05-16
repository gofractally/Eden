import { useMemo, useState } from "react";
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
} from "inductions";

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
