import { GetServerSideProps } from "next";

import { RawLayout, SingleColLayout, useFetchedData } from "_app";
import { getMember, getInduction, Induction } from "members";
import { InductionProfileForm } from "members/components/induction-profile-form";
import { InductionStepProfile } from "members/components/induction-step-profile";

interface Props {
    inductionId?: string;
}

enum InductionStatus {
    invalid,
    waitingForProfile,
    waitingForVideo,
    waitingForEndorsement,
}

export const InductionPage = ({ inductionId }: Props) => {
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
                return "Phase 2/3: Waiting for Induction Video Upload";
            case InductionStatus.waitingForEndorsement:
                return "Phase 3/3: Waiting for Endorsements";
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

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        const inductionId = params!.id as string;
        return { props: { inductionId: inductionId || null } };
    } catch (error) {
        console.error(">>> Fail to parse induction id: " + error);
        return { props: { error: "Fail to get induction id" } };
    }
};
