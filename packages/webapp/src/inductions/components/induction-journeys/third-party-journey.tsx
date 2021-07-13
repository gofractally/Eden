import React from "react";

import { Heading, Text, useIsCommunityActive } from "_app";
import { MemberData } from "members";
import {
    convertPendingProfileToMemberData,
    EndorsementsStatus,
    InductionExpiresIn,
    InductionStepGenesis,
    InductionStepInvitee,
    InductionStepsContainer,
    MemberCardPreview,
    WaitingForProfile,
    WaitingForVideo,
} from "inductions";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";

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

interface Props {
    endorsements: Endorsement[];
    induction: Induction;
    inductionStatus: InductionStatus;
}

export const ThirdPartyJourney = ({
    endorsements,
    induction,
    inductionStatus,
}: Props) => {
    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return <PendingProfileStep induction={induction} />;
        case InductionStatus.PendingCeremonyVideo: // not possible in Genesis mode
            return <PendingVideoStep induction={induction} />;
        case InductionStatus.PendingEndorsement: // not possible in Genesis mode
            return (
                <PendingEndorsementStep
                    induction={induction}
                    endorsements={endorsements}
                />
            );
        case InductionStatus.PendingDonation:
            return (
                <PendingDonationStep
                    induction={induction}
                    endorsements={endorsements}
                />
            );
        default:
            return <p>Unknown error</p>;
    }
};

export default ThirdPartyJourney;

const PendingProfileStep = ({ induction }: { induction: Induction }) => {
    const { data: isCommunityActive } = useIsCommunityActive();
    return (
        <Container
            step={
                isCommunityActive
                    ? InductionStepInvitee.Profile
                    : InductionStepGenesis.Profile
            }
        >
            <WaitingForProfile induction={induction} />
        </Container>
    );
};

const PendingVideoStep = ({ induction }: { induction: Induction }) => {
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
        </Container>
    );
};

interface PendingCompletionProps {
    induction: Induction;
    endorsements: Endorsement[];
}

const PendingEndorsementStep = ({
    induction,
    endorsements,
}: PendingCompletionProps) => {
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
            <Text>Waiting for all witnesses to endorse.</Text>
        </Container>
    );
};

const PendingDonationStep = ({
    induction,
    endorsements,
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
            {isCommunityActive ? (
                <Text>
                    This induction is fully endorsed! As soon as the prospective
                    member completes their donation to the Eden community, their
                    membership will be activated and their Eden NFTs will be
                    minted and distributed.
                </Text>
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
