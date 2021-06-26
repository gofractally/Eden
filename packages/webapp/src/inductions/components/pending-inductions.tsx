import { Endorsement, Induction } from "inductions/interfaces";

import {
    EndorserInductions,
    InviteeInductions,
    InviterInductions,
} from "./induction-lists";

interface Props {
    inductions: Induction[];
    endorsements: Endorsement[];
    isActiveCommunity?: boolean;
    isActiveMember?: boolean;
}

export const PendingInductions = ({
    inductions,
    endorsements,
    isActiveCommunity,
    isActiveMember,
}: Props) => {
    const thereAreEndorsements = endorsements.length > 0;
    const thereAreInductions = inductions.length > 0;

    if (isActiveMember) {
        return (
            <div className="space-y-4">
                {thereAreInductions && (
                    <InviterInductions inductions={inductions} />
                )}
                {thereAreEndorsements && (
                    <EndorserInductions
                        endorsements={endorsements}
                        isActiveCommunity={isActiveCommunity}
                    />
                )}
            </div>
        );
    } else if (thereAreInductions) {
        return (
            <div className="space-y-4">
                <InviteeInductions inductions={inductions} />
            </div>
        );
    }
    return <></>;
};
