import React, { useState } from "react";
import { Heading, Link, Text, useIsCommunityActive } from "_app";
import { convertPendingProfileToMemberData } from "inductions";
import { MemberData } from "members";
import {
    InductionDonateForm,
    InductionProfileFormContainer,
    InductionProfileSubmitConfirmation,
} from "./invitee";
import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForVideo,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";
import { InductionStepGenesis, InductionStepInvitee } from "./common";

interface ContainerProps {
    step: InductionStepInvitee | InductionStepGenesis;
    memberPreview?: MemberData;
    children: React.ReactNode;
    vAlign?: "top";
}

const Container = ({
    step,
    memberPreview,
    children,
    ...props
}: ContainerProps) => (
    <>
        <InductionJourneyContainer step={step} {...props}>
            {children}
        </InductionJourneyContainer>
        {memberPreview && <MemberCardPreview memberData={memberPreview} />}
    </>
);

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
    const { data: isCommunityActive } = useIsCommunityActive();

    const memberData = convertPendingProfileToMemberData(induction);

    // Invitee profile submission confirmation
    if (submittedProfile) {
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
    }

    const renderProfileStep = () => (
        <Container
            step={
                isCommunityActive
                    ? InductionStepInvitee.Profile
                    : InductionStepGenesis.Profile
            }
            vAlign="top"
        >
            <InductionProfileFormContainer
                induction={induction}
                isReviewingProfile={isReviewingProfile}
                setSubmittedProfile={setSubmittedProfile}
            />
        </Container>
    );

    if (isReviewingProfile) {
        return renderProfileStep();
    }

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return renderProfileStep();
        case InductionStatus.PendingCeremonyVideo: // not possible in Genesis mode
            return (
                <Container
                    step={InductionStepInvitee.PendingVideoAndEndorsements}
                    memberPreview={memberData}
                >
                    <WaitingForVideo induction={induction} />
                </Container>
            );
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
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
                            Now is a good time to review your profile
                            information below. If anything needs to be
                            corrected,{" "}
                            <Link onClick={() => setIsReviewingProfile(true)}>
                                click here to make those adjustments.
                            </Link>{" "}
                            Keep in mind that any modifications to your profile
                            will reset any endorsements.
                        </Text>
                    </div>
                </Container>
            );
        case InductionStatus.PendingDonation:
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
                    <EndorsementsStatus endorsements={endorsements} />
                    <InductionDonateForm
                        induction={induction}
                        isCommunityActive={isCommunityActive}
                        setIsReviewingProfile={setIsReviewingProfile}
                    />
                </Container>
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviteeJourney;
