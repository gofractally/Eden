import { useQuery } from "react-query";
import { BsArrowDown } from "react-icons/bs";
import dayjs from "dayjs";

import {
    Container,
    FluidLayout,
    Heading,
    queryMembers,
    Text,
    useCurrentElection,
    useCurrentMember,
    useElectionState,
    useMemberListByAccountNames,
    useMemberStats,
    useMyDelegation,
    useUALAccount,
} from "_app";
import { DelegateChip } from "elections";
import { EdenMember, MemberData } from "members/interfaces";

interface Props {
    delegatesPage: number;
}

export const DelegatesPage = (props: Props) => {
    const [activeUser] = useUALAccount();
    const currentMember = useCurrentMember();

    const { data: currentElection } = useCurrentElection();
    const isElectionInProgress =
        currentElection?.electionState !==
        "current_election_state_registration";

    const { data: myDelegation } = useMyDelegation(!isElectionInProgress);
    const { data: electionState } = useElectionState();

    let nftTemplateIds: number[] = [];
    if (!isElectionInProgress && myDelegation?.length) {
        nftTemplateIds = myDelegation?.map((member) => member.nft_template_id);
    }

    const { data: members } = useQuery({
        ...queryMembers(1, myDelegation?.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: !isElectionInProgress && Boolean(myDelegation?.length),
    });

    if (isElectionInProgress) {
        return (
            <FluidLayout title="My Delegation">
                <Container>
                    <Heading size={1}>Election in Progress</Heading>
                    <Heading size={2}>
                        Come back after the election is complete to see your
                        delegation.
                    </Heading>
                </Container>
            </FluidLayout>
        );
    }
    if (!activeUser)
        return (
            <FluidLayout>
                <div>must be logged in</div>
            </FluidLayout>
        );
    if (!currentMember)
        return (
            <FluidLayout>
                <div>not an Eden Member</div>
            </FluidLayout>
        );
    if (!myDelegation || !members || (myDelegation?.length > 0 && !members))
        return (
            <FluidLayout>
                <div>fetching your Delegation and members...</div>
            </FluidLayout>
        );

    return (
        <FluidLayout title="My Delegation">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>My Delegation</Heading>
                    <Text size="sm">
                        Elected{" "}
                        {dayjs(electionState?.last_election_time).format("LL")}
                    </Text>
                </Container>
                <Delegates myDelegation={myDelegation} members={members} />
            </div>
        </FluidLayout>
    );
};

const MyDelegationArrow = () => (
    <Container className="py-2.5">
        <BsArrowDown size={28} className="ml-3.5 text-gray-400" />
    </Container>
);

const Delegates = ({
    members,
    myDelegation,
}: {
    members: MemberData[];
    myDelegation: EdenMember[];
}) => {
    const { data: membersStats, isLoading } = useMemberStats();
    const { data: loggedInMember } = useCurrentMember();

    if (isLoading) return <div>Loading...</div>;
    if (!loggedInMember || !membersStats)
        return <div>Error fetching member data...</div>;

    const heightOfDelegationWithoutChiefs = membersStats.ranks.length - 2;
    const diff = heightOfDelegationWithoutChiefs - myDelegation.length;
    const numLevelsWithNoRepresentation = diff > 0 ? diff : 0;

    return (
        <>
            {myDelegation
                .slice(0, heightOfDelegationWithoutChiefs)
                .map((delegate, index) => (
                    <div
                        className="-mt-px"
                        key={`my-delegation-${index}-${delegate.account}`}
                    >
                        <DelegateChip
                            member={members.find(
                                (d) => d.account === delegate.account
                            )}
                            level={index + 1}
                        />
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
    const { data: electionState } = useElectionState();
    const { data: membersStats } = useMemberStats();

    const allChiefs = electionState?.board || [];
    // Get EdenMember data, unwrap the QueryResults[] into an EdenMember[], and filter out non-existent members
    const chiefsAsMembers = useMemberListByAccountNames(
        allChiefs,
        Boolean(allChiefs?.length)
    )
        .map((chiefQR) => chiefQR.data)
        .filter((el) => Boolean(el));

    const nftTemplateIds = chiefsAsMembers.map(
        (member) => member!.nft_template_id
    );

    const { data: members } = useQuery({
        ...queryMembers(1, allChiefs.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: Boolean(chiefsAsMembers?.length),
    });

    if (!electionState || !members || !membersStats)
        return <div>fetching data</div>;

    const headChiefAsEdenMember = chiefsAsMembers!.find(
        (d) => d?.account === electionState.lead_representative
    );
    const headChiefAsMemberData = members.find(
        (d) => d?.account === electionState.lead_representative
    );

    if (!headChiefAsEdenMember || !headChiefAsMemberData)
        return <div>Error fetching data</div>;

    return (
        <>
            <Container>
                <Text>Chief Delegates</Text>
            </Container>
            {chiefsAsMembers.map((delegate) => {
                if (!delegate) return null;
                return (
                    <div key={`chiefs-${delegate.account}`}>
                        <DelegateChip
                            member={members.find(
                                (d) => d.account === delegate.account
                            )}
                            level={membersStats.ranks.length - 1}
                        />
                    </div>
                );
            })}
            <MyDelegationArrow />
            <Container>
                <Text>Head Chief</Text>
            </Container>
            <DelegateChip
                member={headChiefAsMemberData}
                level={headChiefAsEdenMember.election_rank + 1}
            />
        </>
    );
};

export default DelegatesPage;
