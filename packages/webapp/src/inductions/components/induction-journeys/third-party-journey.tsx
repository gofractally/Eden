import React from "react";
import { Heading, Text, useIsCommunityActive } from "_app";
import {
    InductionExpiresIn,
    InductionJourney,
    InductionJourneyContainer,
    MemberCardPreview,
    WaitingForProfile,
    WaitingForVideo,
} from "inductions/components";
import { Endorsement, Induction, InductionStatus } from "inductions/interfaces";
import { convertPendingProfileToMemberData } from "inductions";
import { EndorsementsStatus } from "./common";

interface ContainerProps {
    step: 1 | 2 | 3 | 4 | 5;
    children: React.ReactNode;
}

const Container = ({ step, children }: ContainerProps) => (
    <InductionJourneyContainer journey={InductionJourney.INVITEE} step={step}>
        {children}
    </InductionJourneyContainer>
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
        case InductionStatus.waitingForProfile:
            return (
                <Container step={isCommunityActive ? 2 : 1}>
                    <WaitingForProfile induction={induction} />
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
            return (
                <>
                    <Container step={3}>
                        <Heading size={1} className="mb-2">
                            Endorsements
                        </Heading>
                        <InductionExpiresIn induction={induction} />
                        <EndorsementsStatus endorsements={endorsements} />
                        <Text>Waiting for all witnesses to endorse.</Text>
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
                            <Text>
                                This induction is fully endorsed! As soon as the
                                prospective member completes their donation to
                                the Eden community, their membership will be
                                activated and their Eden NFTs will be minted and
                                distributed.
                            </Text>
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

export default ThirdPartyJourney;
