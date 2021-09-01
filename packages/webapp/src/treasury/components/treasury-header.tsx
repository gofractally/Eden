import { assetToString, Heading, Loader, Text, useTreasuryStats } from "_app";

export const TreasuryHeader = () => {
    const { data: treasuryStats, isLoading: isLoading } = useTreasuryStats();

    return (
        <div className="flex justify-between">
            <Heading size={1}>Eden Treasury</Heading>
            <Text size="lg">
                {isLoading ? (
                    <Loader size={24} />
                ) : treasuryStats ? (
                    assetToString(treasuryStats)
                ) : (
                    ""
                )}
            </Text>
        </div>
    );
};

export default TreasuryHeader;
