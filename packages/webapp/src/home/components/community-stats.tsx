import { useQuery } from "react-query";

import { assetToString, queryMembersStats, queryTreasuryStats } from "_app";
import { Container, Heading, Link, Loader, Text } from "_app/ui";
import { ROUTES } from "_app/config";

interface CommunityStatsProps {
    className?: string;
}

export const CommunityStats = ({ className = "" }: CommunityStatsProps) => (
    <div className={className}>
        <CommunityStatsContents />
    </div>
);

export default CommunityStats;

const CommunityStatsContents = () => {
    const { data: memberStats, isLoading: isLoadingMemberStats } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const {
        data: treasuryBalance,
        isLoading: isLoadingTreasuryBalance,
    } = useQuery({
        ...queryTreasuryStats,
        keepPreviousData: true,
    });

    if (
        isLoadingMemberStats ||
        isLoadingTreasuryBalance ||
        (!memberStats && !treasuryBalance)
    ) {
        return (
            <div className="h-full py-12">
                <Loader />
            </div>
        );
    }

    return (
        <Container className="flex flex-col">
            <Heading size={2} className="mb-2">
                Community stats
            </Heading>
            {treasuryBalance && (
                <Text className="font-medium" size="inherit">
                    Treasury: {assetToString(treasuryBalance, 4)}
                </Text>
            )}
            {memberStats && (
                <>
                    <Link href={ROUTES.MEMBERS.href} className="font-medium">
                        {memberStats.active_members} active member
                        {memberStats.active_members !== 1 && "s"}
                    </Link>
                    <Link
                        href={`${ROUTES.INDUCTION.href}/pending-invitations`}
                        className="font-medium"
                    >
                        {memberStats.pending_members} pending invitation
                        {memberStats.pending_members !== 1 && "s"}
                    </Link>
                </>
            )}
        </Container>
    );
};
