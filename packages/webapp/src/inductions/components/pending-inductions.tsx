import { Text, useUALAccount, useFetchedData, Heading } from "_app";

import { getCurrentInductions } from "../api";
import { Endorsement } from "../interfaces";
import {
    EndorserInductions,
    InviteeInductions,
    InviterInductions,
} from "./induction-lists";

interface Props {
    isActive?: boolean;
}

export const PendingInductions = ({ isActive }: Props) => {
    const [ualAccount] = useUALAccount();

    const [currentInductions, isLoading] = useFetchedData<any>(
        getCurrentInductions,
        ualAccount?.accountName,
        isActive
    );

    const inductions = currentInductions ? currentInductions.inductions : [];
    const endorsements = currentInductions
        ? currentInductions.endorsements
        : [];

    const userEndorsements: Endorsement[] = endorsements.filter(
        (end: Endorsement) => end.inviter !== end.endorser
    );

    if (isLoading) {
        return (
            <div className="space-y-4">
                <>Loading inductions...</>
            </div>
        );
    }

    const thereAreEndorsements = userEndorsements.length > 0;
    const thereAreInductions = inductions.length > 0;

    if (isActive) {
        return (
            <div className="space-y-4">
                {thereAreInductions && (
                    <InviterInductions inductions={inductions} />
                )}
                {thereAreEndorsements && (
                    <EndorserInductions endorsements={userEndorsements} />
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

    return (
        <div className="space-y-4">
            <Heading size={2}>Join the Eden Community</Heading>
            <Text>
                It looks like you're not an Eden member yet. To get started, get
                an invitation from someone already in the community using your
                EOS account name. As soon as an active Eden community member
                invites you, their invitation will appear below and will guide
                you through the process.
            </Text>
            <Text>
                [Graphic and/or link explaining the process in more detail.]
            </Text>
        </div>
    );
};
