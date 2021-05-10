import { useState } from "react";
import { useRouter } from "next/router";

import { CallToAction, RawLayout, SingleColLayout, useFetchedData } from "_app";
import {
    getInductionWithEndorsements,
    Induction,
    InductionStepEndorsement,
    InductionStepProfile,
    InductionStepVideo,
    InductionStatus,
    getInductionStatus,
    Endorsement,
} from "inductions";

export const InductionDetailsPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;
    const [reviewStep, setReviewStep] = useState<
        "profile" | "video" | undefined
    >();

    const [inductionEndorsements, isLoading] = useFetchedData<{
        induction: Induction;
        endorsements: Endorsement[];
    }>(getInductionWithEndorsements, inductionId);

    const induction = inductionEndorsements
        ? inductionEndorsements.induction
        : undefined;

    const endorsements = inductionEndorsements
        ? inductionEndorsements.endorsements
        : [];

    const status = getInductionStatus(induction);

    const renderInductionStep = () => {
        if (!induction) return "";

        if (reviewStep === "profile") {
            return <InductionStepProfile induction={induction} isReviewing />;
        }

        if (reviewStep === "video") {
            return (
                <InductionStepVideo
                    induction={induction}
                    endorsements={endorsements}
                    isReviewing
                />
            );
        }

        switch (status) {
            case InductionStatus.waitingForProfile:
                return <InductionStepProfile induction={induction} />;
            case InductionStatus.waitingForVideo:
                return (
                    <InductionStepVideo
                        induction={induction}
                        endorsements={endorsements}
                    />
                );
            case InductionStatus.waitingForEndorsement:
                return (
                    <InductionStepEndorsement
                        induction={induction}
                        endorsements={endorsements}
                        setReviewStep={setReviewStep}
                    />
                );
            default:
                return "";
        }
    };

    return isLoading ? (
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
            {renderInductionStep()}
        </SingleColLayout>
    );
};

export default InductionDetailsPage;
