import React from "react";
import { useQuery } from "react-query";
import dayjs from "dayjs";
import { CgArrowDown } from "react-icons/cg";

import {
    queryMembers,
    SideNavLayout,
    useCurrentElection,
    useElectionState,
    useMemberDataFromEdenMembers,
    useMemberListByAccountNames,
    useMemberStats,
    useMyDelegation,
} from "_app";
import { Container, Heading, LoadingContainer, Text } from "_app/ui";
import { DelegateChip } from "elections";
import { ElectionStatus } from "elections/interfaces";
import { MemberGateContainer } from "members";
import { EdenMember, MemberData } from "members/interfaces";

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
        isLoadingMemberData ||
        !myDelegationMemberData;

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
                        <Delegates
                            myDelegation={myDelegation}
                            members={myDelegationMemberData}
                        />
                    </MemberGateContainer>
                )}
            </div>
        </SideNavLayout>
    );
};

const ErrorLoadingDelegation = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>Error loading delegation information</Heading>
        <Text>Please reload the page to try again.</Text>
    </Container>
);

const ElectionInProgress = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>Election in progress</Heading>
        <Text>
            Come back after the election is complete to see your delegation.
        </Text>
    </Container>
);

const NoDelegationToDisplay = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>No delegation to display</Heading>
        <MemberGateContainer>
            <Text>
                Your delegation will appear here after the first election
                completes.
            </Text>
        </MemberGateContainer>
    </Container>
);

const MyDelegationArrow = () => (
    <Container className="py-1.5 bg-gray-100">
        <CgArrowDown size={28} className="ml-3.5 text-gray-400" />
    </Container>
);

const LevelHeading = ({ children }: { children: React.ReactNode }) => (
    <Container className="py-2.5">
        <Heading size={2}>{children}</Heading>
    </Container>
);

const Delegates = ({
    members,
    myDelegation,
}: {
    members: MemberData[];
    myDelegation: EdenMember[];
}) => {
    const { data: membersStats, isLoading, isError } = useMemberStats();

    if (isLoading) return <LoadingContainer />;
    if (isError || !membersStats) return <ErrorLoadingDelegation />;

    const heightOfDelegationWithoutChiefs = membersStats.ranks.length - 2;
    const diff = heightOfDelegationWithoutChiefs - myDelegation.length;
    const numLevelsWithNoRepresentation = diff > 0 ? diff : 0;

    // TODO: Test with multiple levels
    // TODO: Test with no representation at some levels
    return (
        <>
            {myDelegation
                .slice(0, heightOfDelegationWithoutChiefs)
                .map((delegate, index) => (
                    <div key={`my-delegation-${index}-${delegate.account}`}>
                        {index === 0 ? (
                            <DelegateChip
                                member={members.find(
                                    (d) => d.account === delegate.account
                                )}
                                level={index + 1}
                            />
                        ) : (
                            <>
                                <LevelHeading>
                                    Delegate Level {index}
                                </LevelHeading>
                                <div className="-mt-px">
                                    <DelegateChip
                                        member={members.find(
                                            (d) =>
                                                d.account === delegate.account
                                        )}
                                        level={index + 1}
                                    />
                                </div>
                            </>
                        )}
                        <MyDelegationArrow />
                    </div>
                ))}
            {[...Array(numLevelsWithNoRepresentation)].map((v, idx) => (
                <div className="-mt-px" key={idx}>
                    <DelegateChip />
                    <MyDelegationArrow />
                </div>
            ))}
            <Chiefs />
        </>
    );
};

const Chiefs = () => {
    const {
        data: electionState,
        isLoading: isLoadingElectionState,
        isError: isErrorElectionState,
    } = useElectionState();
    const {
        data: membersStats,
        isLoading: isLoadingMemberStats,
        isError: isErrorMemberStats,
    } = useMemberStats();

    const allChiefAccountNames = electionState?.board || [];
    // Get EdenMember data, unwrap the QueryResults[] into an EdenMember[], and filter out non-existent members
    const chiefsAsMembers = useMemberListByAccountNames(allChiefAccountNames)
        .map((chiefQR) => chiefQR.data)
        .filter((el) => Boolean(el));

    const nftTemplateIds = chiefsAsMembers.map(
        (member) => member!.nft_template_id
    );

    const {
        data: memberData,
        isLoading: isLoadingMemberData,
        isError: isErrorMemberData,
    } = useQuery({
        ...queryMembers(1, allChiefAccountNames.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: Boolean(chiefsAsMembers?.length),
    });

    const isLoading =
        isLoadingElectionState || isLoadingMemberStats || isLoadingMemberData;

    const isError =
        isErrorElectionState ||
        isErrorMemberStats ||
        isErrorMemberData ||
        !electionState ||
        !memberData ||
        !membersStats;

    if (isLoading) {
        return <LoadingContainer />;
    }

    if (isError) {
        return <ErrorLoadingDelegation />;
    }

    // TODO: Handle the no-election-has-ever-happened scenario (just after genesis induction is complete)
    const headChiefAsEdenMember = chiefsAsMembers!.find(
        (d) => d?.account === electionState.lead_representative
    );
    const headChiefAsMemberData = memberData.find(
        (d) => d?.account === electionState.lead_representative
    );

    if (!headChiefAsEdenMember || !headChiefAsMemberData) {
        return <ErrorLoadingDelegation />;
    }

    return (
        <div className="mb-16">
            <LevelHeading>Chief Delegates</LevelHeading>
            {chiefsAsMembers.map((delegate) => {
                if (!delegate) return null;
                return (
                    <div key={`chiefs-${delegate.account}`}>
                        <DelegateChip
                            member={memberData.find(
                                (d) => d.account === delegate.account
                            )}
                            level={membersStats.ranks.length - 1}
                            delegateTitle=""
                        />
                    </div>
                );
            })}
            <MyDelegationArrow />
            <LevelHeading>Head Chief</LevelHeading>
            <DelegateChip
                member={headChiefAsMemberData}
                level={headChiefAsEdenMember.election_rank + 1}
                delegateTitle=""
            />
        </div>
    );
};

export default DelegatesPage;
