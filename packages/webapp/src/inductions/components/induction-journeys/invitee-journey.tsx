import React, { Dispatch, SetStateAction, useState } from "react";

import { Heading, Link, Text, useIsCommunityActive } from "_app";
import { convertPendingProfileToMemberData } from "inductions";
import { MemberData } from "members";

import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionStepGenesis,
    InductionStepInvitee,
    InductionStepsContainer,
    MemberCardPreview,
    WaitingForVideo,
} from "inductions";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";

import {
    InductionDonateForm,
    InductionProfileFormContainer,
    InductionProfileSubmitConfirmation,
} from "./invitee";

interface Props {
    endorsements: Endorsement[];
    induction: Induction;
    inductionStatus: InductionStatus;
}

export const InviteeJourney = ({
    endorsements,
    induction,
    inductionStatus,
}: Props) => {
    const [submittedProfile, setSubmittedProfile] = useState(false);
    const [isReviewingProfile, setIsReviewingProfile] = useState(false);

    if (submittedProfile) {
        return <SubmittedProfileStep />;
    }

    if (isReviewingProfile) {
        return (
            <ProfileStep
                induction={induction}
                isReviewingProfile={isReviewingProfile}
                setSubmittedProfile={setSubmittedProfile}
            />
        );
    }

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return (
                <ProfileStep
                    induction={induction}
                    isReviewingProfile={isReviewingProfile}
                    setSubmittedProfile={setSubmittedProfile}
                />
            );
        case InductionStatus.PendingCeremonyVideo: // not possible in Genesis mode
            return (
                <PendingCeremonyVideoStep
                    induction={induction}
                    setIsReviewingProfile={setIsReviewingProfile}
                />
            );
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
            return (
                <PendingEndorsementStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsReviewingProfile={setIsReviewingProfile}
                />
            );
        case InductionStatus.PendingDonation:
            return (
                <PendingDonationStep
                    induction={induction}
                    endorsements={endorsements}
                    setIsReviewingProfile={setIsReviewingProfile}
                />
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviteeJourney;

interface ContainerProps {
    step: InductionStepInvitee | InductionStepGenesis;
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

const SubmittedProfileStep = () => {
    const { data: isCommunityActive } = useIsCommunityActive();
    return (
        <Container
            step={
                isCommunityActive
                    ? InductionStepInvitee.PendingVideoAndEndorsements
                    : InductionStepGenesis.Donate
            }
        >
            <InductionProfileSubmitConfirmation
                isCommunityActive={isCommunityActive}
            />
        </Container>
    );
};

interface ProfileStepProps {
    induction: Induction;
    isReviewingProfile: boolean;
    setSubmittedProfile: Dispatch<SetStateAction<boolean>>;
}

const ProfileStep = ({
    induction,
    isReviewingProfile,
    setSubmittedProfile,
}: ProfileStepProps) => {
    const { data: isCommunityActive } = useIsCommunityActive();
    return (
        <Container
            step={
                isCommunityActive
                    ? InductionStepInvitee.Profile
                    : InductionStepGenesis.Profile
            }
        >
            <InductionProfileFormContainer
                induction={induction}
                isReviewingProfile={isReviewingProfile}
                setSubmittedProfile={setSubmittedProfile}
            />
        </Container>
    );
};

interface PendingCeremonyVideoStepProps {
    induction: Induction;
    setIsReviewingProfile: Dispatch<SetStateAction<boolean>>;
}

const PendingCeremonyVideoStep = ({
    induction,
    setIsReviewingProfile,
}: PendingCeremonyVideoStepProps) => {
    const memberData = convertPendingProfileToMemberData(induction);
    return (
        <Container
            step={InductionStepInvitee.PendingVideoAndEndorsements}
            memberPreview={memberData}
        >
            <WaitingForVideo induction={induction} />
            <Text className="my-3">
                If anything needs to be corrected,{" "}
                <Link onClick={() => setIsReviewingProfile(true)}>
                    click here to make those adjustments.
                </Link>
            </Text>
        </Container>
    );
};

interface PendingCompletionStepProps {
    induction: Induction;
    endorsements: Endorsement[];
    setIsReviewingProfile: Dispatch<SetStateAction<boolean>>;
}

const PendingEndorsementStep = ({
    induction,
    endorsements,
    setIsReviewingProfile,
}: PendingCompletionStepProps) => {
    const memberData = convertPendingProfileToMemberData(induction);
    return (
        <Container
            step={InductionStepInvitee.PendingVideoAndEndorsements}
            memberPreview={memberData}
        >
            <Heading size={1} className="mb-2">
                Endorsements
            </Heading>
            <InductionExpiresIn induction={induction} />
            <EndorsementsStatus endorsements={endorsements} />
            <div className="space-y-3">
                <Text>To continue, all witnesses must endorse.</Text>
                <Text>
                    Now is a good time to review your profile information below.
                    If anything needs to be corrected,{" "}
                    <Link onClick={() => setIsReviewingProfile(true)}>
                        click here to make those adjustments.
                    </Link>{" "}
                    Keep in mind that any modifications to your profile will
                    reset any endorsements.
                </Text>
            </div>
        </Container>
    );
};

const PendingDonationStep = ({
    induction,
    endorsements,
    setIsReviewingProfile,
}: PendingCompletionStepProps) => {
    const memberData = convertPendingProfileToMemberData(induction);
    const { data: isCommunityActive } = useIsCommunityActive();
    return (
        <Container
            step={
                isCommunityActive
                    ? InductionStepInvitee.Donate
                    : InductionStepGenesis.Donate
            }
            memberPreview={memberData}
        >
            <Heading size={1} className="mb-2">
                Pending donation
            </Heading>
            <InductionExpiresIn induction={induction} />
            {isCommunityActive && (
                <EndorsementsStatus endorsements={endorsements} />
            )}
            <InductionDonateForm
                induction={induction}
                isCommunityActive={isCommunityActive}
                setIsReviewingProfile={setIsReviewingProfile}
            />
        </Container>
    );
};
