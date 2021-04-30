import { CallToAction } from "_app";

import { Endorsement, Induction } from "../interfaces";
import {
    EndorserInductions,
    InviteeInductions,
    InviterInductions,
} from "./induction-lists";

interface Props {
    inductions: Induction[];
    endorsements: Endorsement[];
    isActive?: boolean;
}

export const PendingInductions = ({
    inductions,
    endorsements,
    isActive,
}: Props) => {
    const thereAreEndorsements = endorsements.length > 0;
    const thereAreInductions = inductions.length > 0;

    if (isActive) {
        return (
            <>
                {(thereAreInductions || thereAreEndorsements) && (
                    <CallToAction
                        buttonLabel="Invite to Eden"
                        href="/induction/init"
                    >
                        Invite your trusted contacts in the EOS community to
                        Eden.
                    </CallToAction>
                )}
                <div className="space-y-4">
                    {thereAreInductions && (
                        <InviterInductions inductions={inductions} />
                    )}
                    {thereAreEndorsements && (
                        <EndorserInductions endorsements={endorsements} />
                    )}
                </div>
            </>
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
