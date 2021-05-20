import React, { Dispatch, SetStateAction, useState } from "react";
import { Heading, Link, Text, useIsCommunityActive, useUALAccount } from "_app";
import { MemberData } from "members";
import { convertPendingProfileToMemberData } from "inductions";
import {
    InductionVideoFormContainer,
    InductionEndorsementForm,
    InductionVideoSubmitConfirmation,
} from "./inviter-witnesses";
import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionJourney,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForProfile,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";
import { InductionStepGenesis, InductionStepInviter } from "./common";

interface ContainerProps {
    step: InductionStepInviter | InductionStepGenesis;
    memberPreview?: MemberData;
    children: React.ReactNode;
}

const Container = ({ step, memberPreview, children }: ContainerProps) => {
    // TODO: Does deeply nesting these everywhere trigger multiple queries?
    const { data: isCommunityActive } = useIsCommunityActive();

    return (
        <>
            <InductionJourneyContainer
                journey={
                    isCommunityActive
                        ? InductionJourney.Inviter
                        : InductionJourney.Genesis
                }
                step={step}
            >
                {children}
            </InductionJourneyContainer>{" "}
            {memberPreview && <MemberCardPreview memberData={memberPreview} />}
        </>
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
        // not possible in Genesis mode
        return (
            <Container
                step={InductionStepInviter.VideoAndEndorse}
                memberPreview={memberData}
            >
                <InductionVideoSubmitConfirmation />
            </Container>
        );
    }

    const renderVideoStep = () => (
        // not possible in Genesis mode
        <Container
            step={InductionStepInviter.VideoAndEndorse}
            memberPreview={memberData}
        >
            <InductionVideoFormContainer
                induction={induction}
                isReviewingVideo={isReviewingVideo}
                setSubmittedVideo={setSubmittedVideo}
            />
        </Container>
    );

    if (isReviewingVideo) {
        return renderVideoStep();
    }

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return (
                <Container
                    step={
                        isCommunityActive
                            ? InductionStepInviter.PendingProfile
                            : InductionStepGenesis.Profile
                    }
                >
                    <WaitingForProfile induction={induction} />
                </Container>
            );
        case InductionStatus.PendingCeremonyVideo:
            return renderVideoStep();
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
            const userEndorsementIsPending =
                endorsements.find((e) => e.endorser === ualAccount?.accountName)
                    ?.endorsed === 0;

            return (
                <Container
                    step={InductionStepInviter.VideoAndEndorse}
                    memberPreview={memberData}
                >
                    <Heading size={1} className="mb-2">
                        Endorsements
                    </Heading>
                    <InductionExpiresIn induction={induction} />
                    <EndorsementsStatus endorsements={endorsements} />
                    {userEndorsementIsPending ? (
                        <InductionEndorsementForm
                            induction={induction}
                            setIsReviewingVideo={setIsReviewingVideo}
                        />
                    ) : (
                        <>
                            <Text>Waiting for all witnesses to endorse.</Text>
                            <RecommendReview
                                setIsReviewingVideo={setIsReviewingVideo}
                            />
                        </>
                    )}
                </Container>
            );
        case InductionStatus.PendingDonation:
            return (
                <Container
                    step={
                        isCommunityActive
                            ? InductionStepInviter.PendingDonation
                            : InductionStepGenesis.Donate
                    }
                    memberPreview={memberData}
                >
                    <Heading size={1} className="mb-2">
                        Pending donation
                    </Heading>
                    <InductionExpiresIn induction={induction} />
                    <EndorsementsStatus endorsements={endorsements} />
                    {isCommunityActive ? (
                        <>
                            <Text>
                                This induction is fully endorsed! As soon as the
                                prospective member completes their donation to
                                the Eden community, their membership will be
                                activated and their Eden NFTs will be minted and
                                distributed.
                            </Text>
                            <RecommendReview
                                setIsReviewingVideo={setIsReviewingVideo}
                            />
                        </>
                    ) : (
                        <Text>
                            As soon as this prospective member completes their
                            donation to the Eden community, their membership is
                            ready for activation. Once all Genesis members are
                            fully inducted, memberships will be activated and
                            Eden NFTs will be distributed.
                        </Text>
                    )}
                </Container>
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviterWitnessJourney;
