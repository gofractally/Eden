import React, { useState } from "react";
import { Heading, Link, Text, useIsCommunityActive } from "_app";
import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionJourney,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForVideo,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";
import { InviteeProfileForm } from "./invitee/profile-form";
import { InviteeProfileSubmitConfirmation } from "./invitee";
import { convertPendingProfileToMemberData } from "inductions";
import { InviteeDonateForm } from "./invitee/donate-form";

interface ContainerProps {
    step: 1 | 2 | 3 | 4 | 5;
    children: React.ReactNode;
    vAlign?: "top";
}

const Container = ({ step, children, ...props }: ContainerProps) => {
    // TODO: Does deeply nesting these everywhere trigger multiple queries?
    const { data: isCommunityActive } = useIsCommunityActive();

    return (
        <InductionJourneyContainer
            journey={
                isCommunityActive
                    ? InductionJourney.INVITEE
                    : InductionJourney.GENESIS
            }
            step={step}
            {...props}
        >
            {children}
        </InductionJourneyContainer>
    );
};

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
    if (submittedProfile)
        return (
            <Container step={isCommunityActive ? 3 : 2}>
                <InviteeProfileSubmitConfirmation
                    isCommunityActive={isCommunityActive}
                />
            </Container>
        );

    switch (inductionStatus) {
        case InductionStatus.waitingForProfile:
            return (
                <Container step={isCommunityActive ? 2 : 1} vAlign="top">
                    <InviteeProfileForm
                        induction={induction}
                        isReviewingProfile={isReviewingProfile}
                        setSubmittedProfile={setSubmittedProfile}
                    />
                </Container>
            );
        case InductionStatus.waitingForVideo:
            return (
                <>
                    <Container step={3}>
                        <WaitingForVideo induction={induction} />
                    </Container>
                    <MemberCardPreview memberData={memberData} />
                </>
            );
        case InductionStatus.waitingForEndorsement:
            // TODO: waitingForDonation should be an InductionStatus
            const waitingForDonation = endorsements.every(
                (e) => e.endorsed === 1
            );
            if (waitingForDonation) {
                return (
                    <>
                        <Container step={isCommunityActive ? 4 : 2}>
                            <Heading size={1} className="mb-2">
                                Pending donation
                            </Heading>
                            <InductionExpiresIn induction={induction} />
                            <EndorsementsStatus endorsements={endorsements} />
                            <InviteeDonateForm
                                induction={induction}
                                isCommunityActive={isCommunityActive}
                                setIsReviewingProfile={setIsReviewingProfile}
                            />
                            <MemberCardPreview memberData={memberData} />
                        </Container>
                    </>
                );
            }

            return (
                <>
                    <Container step={3}>
                        <Heading size={1} className="mb-2">
                            Endorsements
                        </Heading>
                        <InductionExpiresIn induction={induction} />
                        <EndorsementsStatus endorsements={endorsements} />
                        <div className="space-y-3">
                            <Text>
                                To continue, all witnesses must endorse.
                            </Text>
                            <Text>
                                Now is a good time to review your profile
                                information below. If anything needs to be
                                corrected,{" "}
                                <Link
                                    onClick={() => setIsReviewingProfile(true)}
                                >
                                    click here to make those adjustments.
                                </Link>{" "}
                                Keep in mind that any modifications to your
                                profile will reset any endorsements.
                            </Text>
                        </div>
                    </Container>
                    <MemberCardPreview memberData={memberData} />
                </>
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default InviteeJourney;
