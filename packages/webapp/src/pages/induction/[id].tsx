import { useState } from "react";
import { useRouter } from "next/router";

import { RawLayout, SingleColLayout, useFetchedData } from "_app";
import {
    getInduction,
    Induction,
    InductionStepEndorsement,
    InductionStepProfile,
    InductionStepVideo,
    InductionStatus,
    getInductionStatus,
} from "inductions";

export const InductionPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;
    const [reviewStep, setReviewStep] = useState<
        "profile" | "video" | undefined
    >();

    const [induction, isLoading] = useFetchedData<Induction>(
        getInduction,
        inductionId
    );

    const status = getInductionStatus(induction);

    const renderInductionStep = () => {
        if (!induction) return "";

        if (reviewStep === "profile") {
            return <InductionStepProfile induction={induction} isReviewing />;
        }

        if (reviewStep === "video") {
            return <InductionStepVideo induction={induction} isReviewing />;
        }

        switch (status) {
            case InductionStatus.waitingForProfile:
                return <InductionStepProfile induction={induction} />;
            case InductionStatus.waitingForVideo:
                return <InductionStepVideo induction={induction} />;
            case InductionStatus.waitingForEndorsement:
                return (
                    <InductionStepEndorsement
                        induction={induction}
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
        <RawLayout title="Induction not found">
            <div className="text-center max-w p-8">
                <p>:(</p>
                <p>
                    Perhaps this induction was expired after 7 days? Or the
                    invitee was approved through another induction process.
                </p>
            </div>
        </RawLayout>
    ) : (
        <SingleColLayout title={`Induction #${inductionId}`}>
            {renderInductionStep()}
        </SingleColLayout>
    );
};

export default InductionPage;
