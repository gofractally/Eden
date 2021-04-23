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
        <>
            <Heading size={2}>Your Inductions</Heading>
            <div className="space-y-4">
                {!isActive && !inductions.length && (
                    <Text className="mb-4">
                        Have you already reached out to your inviter? As soon as
                        they invite you, the induction process will be displayed
                        here.
                    </Text>
                )}
                <InductionsList inductions={inductions} isInviter={isActive} />

                {isActive && endorsements.length ? (
                    <EndorsementsList endorsements={endorsements} />
                ) : (
                    ""
                )}
            </div>
        </>
    );
};
