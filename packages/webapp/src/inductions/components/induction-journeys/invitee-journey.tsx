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
import {
    Endorsement,
    Induction,
    InductionStatus,
    NewMemberProfile,
} from "inductions/interfaces";

import {
    InductionDonateForm,
    InductionProfileFormContainer,
    InductionProfilePreview,
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
    const [didSubmitProfile, setDidSubmitProfile] = useState(false);
    const [isReviewingProfile, setIsReviewingProfile] = useState(false);

    if (didSubmitProfile) {
        return <SubmittedProfileStep />;
    }

    if (isReviewingProfile) {
        return (
            <ProfileStep
                induction={induction}
                isReviewingProfile={isReviewingProfile}
                setDidSubmitProfile={setDidSubmitProfile}
            />
        );
    }

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return (
                <ProfileStep
                    induction={induction}
                    isReviewingProfile={isReviewingProfile}
                    setDidSubmitProfile={setDidSubmitProfile}
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
    setDidSubmitProfile: Dispatch<SetStateAction<boolean>>;
}

const ProfileStep = ({
    induction,
    isReviewingProfile,
    setDidSubmitProfile,
}: ProfileStepProps) => {
    const { data: isCommunityActive } = useIsCommunityActive();
    const [showPreview, setShowPreview] = useState<Boolean>(false);
    const [pendingProfile, setPendingProfile] = useState<
        NewMemberProfile | undefined
    >();
    const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<
        File | undefined
    >();

    const setProfilePreview = (
        profileData: NewMemberProfile,
        profilePhoto?: File
    ) => {
        setPendingProfile(profileData);
        setSelectedProfilePhoto(profilePhoto);
        setShowPreview(true);
    };

    // Move form submission logic into a profile preview component that's now in charge of submitting the transaction
    // The form container and form will now only be in charge of hydrating the form state (if present) and passing it up to this ProfileStep component
    // This component will pass it down, in turn, to the preview component and back ot the ProfileForm if user toggles back to make changes

    if (showPreview && pendingProfile) {
        return (
            <InductionProfilePreview
                induction={induction}
                setDidSubmitProfile={setDidSubmitProfile}
                newMemberProfile={pendingProfile}
                selectedProfilePhoto={selectedProfilePhoto}
                showProfileForm={() => setShowPreview(false)}
            />
        );
    }

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
                isReviewingProfile={isReviewingProfile} // isRevisitingProfile? isEditingProfile?
                pendingProfile={pendingProfile}
                selectedProfilePhoto={selectedProfilePhoto}
                setProfilePreview={setProfilePreview}
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
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
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
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
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
    const memberData = convertPendingProfileToMemberData(
        induction.new_member_profile,
        induction.invitee,
        induction.video
    );
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
