import { Endorsement } from "../interfaces";

interface EndorsementsListProps {
    endorsements: Endorsement[];
}

export const EndorsementsList = ({ endorsements }: EndorsementsListProps) => {
    return <div>Endorsements: {endorsements.length}</div>;
};
