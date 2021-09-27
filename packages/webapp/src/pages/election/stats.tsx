import { SideNavLayout, useCurrentGlobalElectionData } from "_app";
import { Container, Heading, Loader } from "_app/ui";
import { ErrorLoadingElection } from "elections";

export const ElectionStatsPage = () => {
    const {
        data: globalElectionData,
        isLoading: isLoading,
        isError: isError,
    } = useCurrentGlobalElectionData();

    if (isError || !globalElectionData) return <ErrorLoadingElection />;

    return (
        <SideNavLayout title="Election Stats">
            {isLoading ? (
                <LoaderSection />
            ) : (
                <div className="divide-y">
                    <Container>
                        <Heading size={1}>Election Stats</Heading>
                        <p>
                            Election Time: {globalElectionData.time.toString()}
                        </p>
                        <pre>
                            {JSON.stringify(
                                globalElectionData.rounds,
                                undefined,
                                2
                            )}
                        </pre>
                    </Container>
                </div>
            )}
        </SideNavLayout>
    );
};

export default ElectionStatsPage;

const LoaderSection = () => (
    <Container>
        <Loader />
    </Container>
);
