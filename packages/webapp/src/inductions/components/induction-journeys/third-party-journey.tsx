import React from "react";
import { Heading, Text, useIsCommunityActive } from "_app";
import { MemberData } from "members";
import { convertPendingProfileToMemberData } from "inductions";
import {
    EndorsementsStatus,
    InductionExpiresIn,
    InductionJourney,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForProfile,
    WaitingForVideo,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";

interface ContainerProps {
    step: 1 | 2 | 3 | 4 | 5;
    memberPreview?: MemberData;
    children: React.ReactNode;
}

const Container = ({ step, memberPreview, children }: ContainerProps) => (
    <>
        <InductionJourneyContainer
            journey={InductionJourney.Invitee}
            step={step}
        >
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

export const ThirdPartyJourney = ({
    endorsements,
    induction,
    inductionStatus,
}: Props) => {
    const { data: isCommunityActive } = useIsCommunityActive();

    const memberData = convertPendingProfileToMemberData(induction);

    switch (inductionStatus) {
        case InductionStatus.PendingProfile:
            return (
                <Container step={isCommunityActive ? 2 : 1}>
                    <WaitingForProfile induction={induction} />
                </Container>
            );
        case InductionStatus.PendingCeremonyVideo:
            return (
                <Container step={3} memberPreview={memberData}>
                    <WaitingForVideo induction={induction} />
                </Container>
            );
        case InductionStatus.PendingEndorsement:
            return (
                <Container step={3} memberPreview={memberData}>
                    <Heading size={1} className="mb-2">
                        Endorsements
                    </Heading>
                    <InductionExpiresIn induction={induction} />
                    <EndorsementsStatus endorsements={endorsements} />
                    <Text>Waiting for all witnesses to endorse.</Text>
                </Container>
            );
        case InductionStatus.PendingDonation:
            return (
                <Container
                    step={isCommunityActive ? 4 : 2}
                    memberPreview={memberData}
                >
                    <Heading size={1} className="mb-2">
                        Pending donation
                    </Heading>
                    <InductionExpiresIn induction={induction} />
                    <EndorsementsStatus endorsements={endorsements} />
                    {isCommunityActive ? (
                        <Text>
                            This induction is fully endorsed! As soon as the
                            prospective member completes their donation to the
                            Eden community, their membership will be activated
                            and their Eden NFTs will be minted and distributed.
                        </Text>
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

export default ThirdPartyJourney;
