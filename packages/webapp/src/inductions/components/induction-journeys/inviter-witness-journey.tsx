import React, { Dispatch, SetStateAction, useState } from "react";
import { Heading, Link, Text, useIsCommunityActive, useUALAccount } from "_app";
import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionJourney,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForProfile,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";
import { convertPendingProfileToMemberData } from "inductions";
import { InviterWitnessVideoForm } from "./inviter-witnesses/video-form";
import {
    InviterWitnessEndorsementForm,
    InviterWitnessVideoSubmitConfirmation,
} from "./inviter-witnesses";

interface ContainerProps {
    step: 1 | 2 | 3 | 4 | 5;
    children: React.ReactNode;
}

const Container = ({ step, children }: ContainerProps) => {
    // TODO: Does deeply nesting these everywhere trigger multiple queries?
    const { data: isCommunityActive } = useIsCommunityActive();

    return (
        <InductionJourneyContainer
            journey={
                isCommunityActive
                    ? InductionJourney.INVITER
                    : InductionJourney.GENESIS
            }
            step={step}
        >
            {children}
        </InductionJourneyContainer>
    );
};

const RecommendReview = ({
    setIsReviewingVideo,
}: {
    setIsReviewingVideo: Dispatch<SetStateAction<boolean>>;
}) => (
    <div className="mt-4 space-y-3">
        <Text>
            In the meantime, we recommend reviewing the prospective member
            profile information below for accuracy. If anything needs to be
            corrected, ask the invitee to sign in and make the corrections.
        </Text>
        <Text>
            If the induction video needs to be corrected,{" "}
            <Link onClick={() => setIsReviewingVideo(true)}>click here</Link>.
            Keep in mind that modifying the induction video will reset any
            endorsements.
        </Text>
    </div>
);

interface Props {
    endorsements: Endorsement[];
    induction: Induction;
    inductionStatus: InductionStatus;
}

export const InviterWitnessJourney = ({
    endorsements,
    induction,
    inductionStatus,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [submittedVideo, setSubmittedVideo] = useState(false);
    const [isReviewingVideo, setIsReviewingVideo] = useState(false);
    const { data: isCommunityActive } = useIsCommunityActive();

    const memberData = convertPendingProfileToMemberData(induction);

    // Inviter video submission confirmation
    if (submittedVideo) {
        return (
            <>
                <Container step={3}>
                    <InviterWitnessVideoSubmitConfirmation />
                </Container>
                <MemberCardPreview memberData={memberData} />
            </>
        );
    }

    const renderVideoStep = () => (
        <>
            <Container step={3}>
                <InviterWitnessVideoForm
                    induction={induction}
                    isReviewingVideo={isReviewingVideo}
                    setSubmittedVideo={setSubmittedVideo}
                />
            </Container>
            <MemberCardPreview memberData={memberData} />
        </>
    );

    if (isReviewingVideo) {
        return renderVideoStep();
    }

    switch (inductionStatus) {
        case InductionStatus.waitingForProfile:
            return (
                <Container step={isCommunityActive ? 2 : 1}>
                    <WaitingForProfile induction={induction} />
                </Container>
            );
        case InductionStatus.waitingForVideo:
            return renderVideoStep();
        case InductionStatus.waitingForEndorsement:
            const userEndorsementIsPending =
                endorsements.find((e) => e.endorser === ualAccount?.accountName)
                    ?.endorsed === 0;

            return (
                <>
                    <Container step={3}>
                        <Heading size={1} className="mb-2">
                            Endorsements
                        </Heading>
                        <InductionExpiresIn induction={induction} />
                        <EndorsementsStatus endorsements={endorsements} />
                        {userEndorsementIsPending ? (
                            <InviterWitnessEndorsementForm
                                endorsements={endorsements}
                                induction={induction}
                                setIsReviewingVideo={setIsReviewingVideo}
                            />
                        ) : (
                            <>
                                <Text>
                                    Waiting for all witnesses to endorse.
                                </Text>
                                <RecommendReview
                                    setIsReviewingVideo={setIsReviewingVideo}
                                />
                            </>
                        )}
                    </Container>
                    <MemberCardPreview memberData={memberData} />
                </>
            );
        case InductionStatus.waitingForDonation:
            return (
                <>
                    <Container step={isCommunityActive ? 4 : 2}>
                        <Heading size={1} className="mb-2">
                            Pending donation
                        </Heading>
                        <InductionExpiresIn induction={induction} />
                        <EndorsementsStatus endorsements={endorsements} />
                        {isCommunityActive ? (
                            <>
                                <Text>
                                    This induction is fully endorsed! As soon as
                                    the prospective member completes their
                                    donation to the Eden community, their
                                    membership will be activated and their Eden
                                    NFTs will be minted and distributed.
                                </Text>
                                <RecommendReview
                                    setIsReviewingVideo={setIsReviewingVideo}
                                />
                            </>
                        ) : (
                            <Text>
                                As soon as this prospective member completes
                                their donation to the Eden community, their
                                membership is ready for activation. Once all
                                Genesis members are fully inducted, memberships
                                will be activated and Eden NFTs will be
                                distributed.
                            </Text>
                        )}
                    </Container>
                    <MemberCardPreview memberData={memberData} />
                </>
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviterWitnessJourney;
