import {
    Induction,
    Endorsement,
    InductionRole,
    InductionStatus,
    InviteeJourney,
    InviterWitnessJourney,
    ThirdPartyJourney,
    useInductionUserRole,
} from "inductions";

interface Props {
    induction: Induction;
    endorsements: Endorsement[];
    status: InductionStatus;
}

export const InductionJourneyContainer = ({
    induction,
    endorsements,
    status,
}: Props) => {
    const userRole = useInductionUserRole(endorsements, induction);
    switch (userRole) {
        case InductionRole.Inviter:
        case InductionRole.Endorser:
            return (
                <InviterWitnessJourney
                    endorsements={endorsements}
                    induction={induction}
                    inductionStatus={status}
                />
            );
        case InductionRole.Invitee:
            return (
                <InviteeJourney
                    endorsements={endorsements}
                    induction={induction}
                    inductionStatus={status}
                />
            );
        default:
            return (
                <ThirdPartyJourney
                    endorsements={endorsements}
                    induction={induction}
                    inductionStatus={status}
                />
            );
    }
};
