import {
    Asset,
    assetToLocaleString,
    Text,
    useMasterPool,
    useMemberStats,
    useScheduledDistributionTargetAmount,
    useTreasuryStats,
} from "_app";

enum RankLabel {
    NumberedLevel = "N",
    Chief = "Chief",
    HeadChief = "Head-chief",
}

export const TreasuryDelegateLevelsInfo = () => {
    const { data: memberStats } = useMemberStats();
    const { data: pool } = useMasterPool();
    const { data: treasuryStats } = useTreasuryStats();
    const scheduled = useScheduledDistributionTargetAmount();

    if (
        !memberStats ||
        !pool ||
        !treasuryStats ||
        memberStats.ranks.length < 2
    ) {
        return null;
    }

    // we don't care about the initial round, it just indicates
    // how many people participated in the election, the real
    // delegates starts from the index 1
    const electedRanks = memberStats.ranks.slice(1);
    const electedRanksSize = electedRanks.length;

    const totalDistributionAmount = scheduled
        ? scheduled.quantity
        : (treasuryStats.quantity * pool.monthly_distribution_pct) / 100;

    const levelDistribution = totalDistributionAmount / electedRanksSize;

    const calculateAndRenderRankLevelComponent = (
        rankDelegatesCount: number,
        index: number
    ) => {
        const currentRank = index + 1;

        // we need to consider all the next rank delegates in the distribution
        const nextRankDelegatesCount = electedRanks
            .slice(currentRank)
            .reduce((a, b) => a + b, 0);

        const rankAmountQuantity =
            levelDistribution / (rankDelegatesCount + nextRankDelegatesCount);
        const rankAmount = { ...treasuryStats, quantity: rankAmountQuantity };

        const label =
            currentRank === electedRanksSize
                ? RankLabel.HeadChief
                : currentRank === electedRanksSize - 1
                ? RankLabel.Chief
                : RankLabel.NumberedLevel;

        return (
            <RankLevelDistribution
                label={label}
                level={index + 1}
                amount={rankAmount}
                key={`rank-level-${label}`}
            />
        );
    };

    return (
        <div className="space-y-3 p-4">
            {electedRanks.map(calculateAndRenderRankLevelComponent)}
        </div>
    );
};

interface RankLevelDistributionProps {
    label: RankLabel;
    amount: Asset;
    level: number;
}

const RankLevelDistribution = ({
    label,
    amount,
    level,
}: RankLevelDistributionProps) => {
    const labelText = label === RankLabel.NumberedLevel ? `${level}` : label;

    return (
        <div className="flex justify-between">
            <div>
                <Text size="sm">
                    <strong>Per {labelText} Delegate</strong>
                </Text>
                <Text size="sm">Projected next disbursement amount:</Text>
            </div>
            <div>
                <Text size="sm">
                    <strong>Amount:</strong>
                </Text>
                <Text size="sm">{assetToLocaleString(amount)}</Text>
            </div>
        </div>
    );
};

export default TreasuryDelegateLevelsInfo;
