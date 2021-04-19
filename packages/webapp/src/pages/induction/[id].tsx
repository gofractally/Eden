import { useRouter } from "next/router";

import { RawLayout, SingleColLayout, useFetchedData } from "_app";
import {
    getInduction,
    Induction,
    InductionStepEndorsement,
    InductionStepProfile,
    InductionStepVideo,
    InductionStatus,
} from "inductions";

export const InductionPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    const [induction, isLoading] = useFetchedData<Induction>(
        getInduction,
        inductionId
    );

    const phase = !induction
        ? InductionStatus.invalid
        : !induction.new_member_profile.name
        ? InductionStatus.waitingForProfile
        : !induction.video
        ? InductionStatus.waitingForVideo
        : InductionStatus.waitingForEndorsement;

    const renderInductionStep = () => {
        if (!induction) return "";

        switch (phase) {
            case InductionStatus.waitingForProfile:
                return <InductionStepProfile induction={induction} />;
            case InductionStatus.waitingForVideo:
                return <InductionStepVideo induction={induction} />;
            case InductionStatus.waitingForEndorsement:
                return <InductionStepEndorsement induction={induction} />;
            default:
                return "";
        }
    };

    return isLoading ? (
        <p>Loading Induction...</p>
    ) : phase === InductionStatus.invalid ? (
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
