import React from "react";
import dayjs from "dayjs";

import {
    SideNavLayout,
    useCurrentElection,
    useElectionState,
    useMemberDataFromEdenMembers,
    useMyDelegation,
} from "_app";
import { Container, Heading, LoadingContainer, Text } from "_app/ui";
import { ElectionStatus } from "elections/interfaces";
import { MemberGateContainer } from "members";
import {
    ErrorLoadingDelegation,
    ElectionInProgress,
    NoDelegationToDisplay,
} from "delegates/components/statuses";
import MyDelegation from "delegates/components/my-delegation"; // avoid circular depenency

export const DelegatesPage = () => {
    const {
        data: currentElection,
        isLoading: isLoadingCurrentElection,
        isError: isErrorCurrentElection,
    } = useCurrentElection();
    const isElectionInProgress =
        currentElection?.electionState !== ElectionStatus.Registration;

    const {
        data: myDelegation,
        isLoading: isLoadingMyDelegation,
        isError: isErrorMyDelegation,
    } = useMyDelegation({
        queryOptions: { enabled: !isElectionInProgress },
    });

    const {
        data: electionState,
        isLoading: isLoadingElectionState,
        isError: isErrorElectionState,
    } = useElectionState();

    const {
        data: myDelegationMemberData,
        isLoading: isLoadingMemberData,
        isError: isErrorMemberData,
    } = useMemberDataFromEdenMembers(myDelegation);

    const isLoading =
        isLoadingCurrentElection ||
        isLoadingMyDelegation ||
        isLoadingElectionState ||
        isLoadingMemberData;

    const isError =
        isErrorCurrentElection ||
        isErrorMyDelegation ||
        isErrorElectionState ||
        isErrorMemberData;

    return (
        <SideNavLayout title="My Delegation">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>My Delegation</Heading>
                    {!isLoading &&
                        !isError &&
                        !isElectionInProgress &&
                        myDelegation && (
                            <Text size="sm">
                                Elected{" "}
                                {dayjs(
                                    electionState?.last_election_time
                                ).format("LL")}
                            </Text>
                        )}
                </Container>
                {isLoading ? (
                    <LoadingContainer />
                ) : isError ? (
                    <ErrorLoadingDelegation />
                ) : isElectionInProgress ? (
                    <ElectionInProgress />
                ) : !myDelegation || !myDelegationMemberData ? (
                    <NoDelegationToDisplay />
                ) : (
                    <MemberGateContainer>
                        <MyDelegation
                            myDelegation={myDelegation}
                            members={myDelegationMemberData}
                            electionState={electionState}
                        />
                    </MemberGateContainer>
                )}
            </div>
        </SideNavLayout>
    );
};

export default DelegatesPage;
