import React, { Dispatch, SetStateAction, useState } from "react";

import { Heading, Link, Text, useIsCommunityActive, useUALAccount } from "_app";

import { MemberData } from "members";
import {
    convertPendingProfileToMemberData,
    EndorsementsStatus,
    InductionExpiresIn,
    InductionStepGenesis,
    InductionStepInviter,
    InductionStepsContainer,
    MemberCardPreview,
    WaitingForProfile,
} from "inductions";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";

import {
    InductionVideoFormContainer,
    InductionEndorsementForm,
    InductionVideoSubmitConfirmation,
} from "./inviter-witnesses";

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
    const [submittedVideo, setSubmittedVideo] = useState(false);
    const [isReviewingVideo, setIsReviewingVideo] = useState(false);

    if (submittedVideo) {
        // not possible in Genesis mode
        return <SubmittedVideoStep induction={induction} />;
    }

    if (isReviewingVideo) {
        // not possible in Genesis mode
        return (
            <VideoStep
                induction={induction}
                isReviewingVideo={isReviewingVideo}
                setSubmittedVideo={setSubmittedVideo}
            />
        );
    }

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return <PendingProfileStep induction={induction} />;
        case InductionStatus.PendingCeremonyVideo: // not possible in Genesis mode
            return (
                <VideoStep
                    induction={induction}
                    isReviewingVideo={isReviewingVideo}
                    setSubmittedVideo={setSubmittedVideo}
                />
            );
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
            return (
                <PendingEndorsementStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsReviewingVideo={setIsReviewingVideo}
                />
            );
        case InductionStatus.PendingDonation:
            return (
                <PendingDonationStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsReviewingVideo={setIsReviewingVideo}
                />
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviterWitnessJourney;

interface ContainerProps {
    step: InductionStepInviter | InductionStepGenesis;
    memberPreview?: MemberData;
    children: React.ReactNode;
}

const Container = ({ step, memberPreview, children }: ContainerProps) => (
    <>
        <InductionStepsContainer step={step}>
            {children}
        </InductionStepsContainer>
        {memberPreview && <MemberCardPreview memberData={memberPreview} />}
    </>
);

const RecommendReview = ({
    setIsReviewingVideo,
}: {
    setIsReviewingVideo: Dispatch<SetStateAction<boolean>>;
}) => (
    <div className="mt-4 space-y-3">
        <Text>
            Carefully review the prospective member profile information below.
            Make sure that all social handles and links are accurate and
            working. If anything needs to be corrected, ask the invitee to sign
            in and make the corrections.
        </Text>
        <Text>
            If the induction video needs to be corrected,{" "}
            <Link onClick={() => setIsReviewingVideo(true)}>click here</Link>.
            Keep in mind that modifying the induction video will reset any
            endorsements.
        </Text>
    </div>
);

const SubmittedVideoStep = ({ induction }: { induction: Induction }) => {
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
    return (
        <Container
            step={InductionStepInviter.VideoAndEndorse}
            memberPreview={memberData}
        >
            <InductionVideoSubmitConfirmation />
        </Container>
    );
};

interface VideoStepProps {
    induction: Induction;
    isReviewingVideo: boolean;
    setSubmittedVideo: Dispatch<SetStateAction<boolean>>;
}

const VideoStep = ({
    induction,
    isReviewingVideo,
    setSubmittedVideo,
}: VideoStepProps) => {
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
    return (
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
};

const PendingProfileStep = ({ induction }: { induction: Induction }) => {
    const { data: isCommunityActive } = useIsCommunityActive();
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
};

interface PendingCompletionProps {
    induction: Induction;
    endorsements: Endorsement[];
    setIsReviewingVideo: Dispatch<SetStateAction<boolean>>;
}

const PendingEndorsementStep = ({
    induction,
    endorsements,
    setIsReviewingVideo,
}: PendingCompletionProps) => {
    const [ualAccount] = useUALAccount();
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
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
                <>
                    <RecommendReview
                        setIsReviewingVideo={setIsReviewingVideo}
                    />
                    <InductionEndorsementForm induction={induction} />
                </>
            ) : (
                <>
                    <Text>
                        Waiting for all witnesses to endorse. In the meantime:
                    </Text>
                    <RecommendReview
                        setIsReviewingVideo={setIsReviewingVideo}
                    />
                </>
            )}
        </Container>
    );
};

const PendingDonationStep = ({
    induction,
    endorsements,
    setIsReviewingVideo,
}: PendingCompletionProps) => {
    const { data: isCommunityActive } = useIsCommunityActive();
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
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
                        prospective member completes their donation to the Eden
                        community, their membership will be activated and their
                        Eden NFTs will be minted and distributed.
                    </Text>
                    <RecommendReview
                        setIsReviewingVideo={setIsReviewingVideo}
                    />
                </>
            ) : (
                <Text>
                    As soon as this prospective member completes their donation
                    to the Eden community, their membership is ready for
                    activation. Once all Genesis members are fully inducted,
                    memberships will be activated and Eden NFTs will be
                    distributed.
                </Text>
            )}
        </Container>
    );
};
