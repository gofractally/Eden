import { Text, useUALAccount, useFetchedData, Heading } from "_app";

import { getCurrentInductions } from "../api";
import { EndorsementsList } from "./endorsements-list";
import { InductionsList } from "./inductions-list";

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

    return isLoading ? (
        <>Loading Inductions...</>
    ) : (
        <div className="space-y-4">
            {!isActive && !inductions.length && (
                <>
                    <Heading size={2}>Join the Eden Community</Heading>
                    <Text>
                        It looks like you're not an Eden member yet. To get
                        started, get an invitation from someone already in the
                        community using your EOS account name. As soon as an
                        active Eden community member invites you, their
                        invitation will appear below and will guide you through
                        the process.
                    </Text>
                    <Text>
                        [Graphic and/or link explaining the process in more
                        detail.]
                    </Text>
                </>
            )}
            <InductionsList inductions={inductions} isInviter={isActive} />

            {isActive && endorsements.length ? (
                <EndorsementsList endorsements={endorsements} />
            ) : (
                ""
            )}
        </div>
    );
};
