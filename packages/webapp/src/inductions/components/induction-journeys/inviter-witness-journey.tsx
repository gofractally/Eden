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
    const [isRevisitingVideo, setIsRevisitingVideo] = useState(false);

    if (submittedVideo) {
        // not possible in Genesis mode
        return <SubmittedVideoStep induction={induction} />;
    }

    if (isRevisitingVideo) {
        // not possible in Genesis mode
        return (
            <VideoStep
                induction={induction}
                isRevisitingVideo={isRevisitingVideo}
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
                    isRevisitingVideo={isRevisitingVideo}
                    setSubmittedVideo={setSubmittedVideo}
                />
            );
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
            return (
                <PendingEndorsementStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsRevisitingVideo={setIsRevisitingVideo}
                />
            );
        case InductionStatus.PendingDonation:
            return (
                <PendingDonationStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsRevisitingVideo={setIsRevisitingVideo}
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
    setIsRevisitingVideo,
}: {
    setIsRevisitingVideo: Dispatch<SetStateAction<boolean>>;
}) => (
    <div className="mt-4 space-y-3">
        <Heading size={2} className="mb-2">
            Review profile
        </Heading>
        <Text>
            Carefully review the prospective member profile information below.
            Make sure that all social handles and links are accurate and
            working. If anything needs to be corrected, ask the invitee to sign
            in and make the corrections.
        </Text>
        <Text>
            If the induction video needs to be corrected,{" "}
            <Link onClick={() => setIsRevisitingVideo(true)}>click here</Link>.
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
    isRevisitingVideo: boolean;
    setSubmittedVideo: Dispatch<SetStateAction<boolean>>;
}

const VideoStep = ({
    induction,
    isRevisitingVideo,
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
                isRevisitingVideo={isRevisitingVideo}
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
    setIsRevisitingVideo: Dispatch<SetStateAction<boolean>>;
}

const PendingEndorsementStep = ({
    induction,
    endorsements,
    setIsRevisitingVideo,
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
                <InductionEndorsementForm
                    induction={induction}
                    setIsRevisitingVideo={setIsRevisitingVideo}
                />
            ) : (
                <>
                    <Text>
                        Waiting for all witnesses to endorse. In the meantime:
                    </Text>
                    <RecommendReview
                        setIsRevisitingVideo={setIsRevisitingVideo}
                    />
                </>
            )}
        </Container>
    );
};

const PendingDonationStep = ({
    induction,
    endorsements,
    setIsRevisitingVideo,
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
                        setIsRevisitingVideo={setIsRevisitingVideo}
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
