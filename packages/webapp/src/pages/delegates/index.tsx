import { useQuery } from "react-query";
import { BsArrowDown } from "react-icons/bs";

import {
    Container,
    FluidLayout,
    Heading,
    queryMembers,
    Text,
    useCurrentElection,
    useElectionState,
    useMemberListByAccountNames,
    useMemberStats,
    useMyDelegation,
    useUALAccount,
} from "_app";
import { DelegateChip } from "elections";
import { EdenMember, MemberData, MemberStats } from "members/interfaces";
import dayjs from "dayjs";
import { isValidDelegate } from "delegates/api";

interface Props {
    delegatesPage: number;
}

export const DelegatesPage = (props: Props) => {
    const [activeUser] = useUALAccount();
    const { data: myDelegation } = useMyDelegation();
    const { data: currentElection } = useCurrentElection();
    const { data: electionState } = useElectionState();

    const nftTemplateIds = myDelegation?.map(
        (member) => member.nft_template_id
    );

    const { data: members } = useQuery({
        ...queryMembers(1, myDelegation?.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: Boolean(myDelegation?.length),
    });

    if (!activeUser) return <div>must be logged in</div>;
    if (!myDelegation || !currentElection)
        return <div>fetching your Delegation...</div>;

    return (
        <FluidLayout title="My Delegation">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>My Delegation</Heading>
                    <Text size="sm">
                        Elected{" "}
                        {dayjs(electionState?.last_election_time).format(
                            "MMMM D, YYYY"
                        )}
                    </Text>
                </Container>
                <Delegates myDelegation={myDelegation} members={members} />
            </div>
        </FluidLayout>
    );
};

const isDelegateNonChief = (delegateRank: number, membersStats: MemberStats) =>
    delegateRank <= membersStats.ranks.length - 2;

const Delegates = ({
    members,
    myDelegation,
}: {
    members?: MemberData[];
    myDelegation: EdenMember[];
}) => {
    const { data: membersStats, isLoading } = useMemberStats();

    console.info(
        `members[${Boolean(members)}], membersStats[${Boolean(membersStats)}]`
    );
    if (isLoading) return <div>Loading...</div>;
    if (!membersStats) return <div>Error fetching member data...</div>;

    return (
        <>
            {myDelegation.map((delegate, index) => (
                <div
                    className="-mt-px"
                    key={`my-delegation-${members![index].account}`}
                >
                    <DelegateChip
                        member={members!.find(
                            (d) => d.account === delegate.account
                        )}
                        level={delegate.election_rank}
                    />
                    {isDelegateNonChief(delegate.election_rank, membersStats) &&
                        isValidDelegate(delegate.representative) && (
                            <Container className="py-2.5">
                                <BsArrowDown
                                    size={28}
                                    className="ml-3.5 text-gray-400"
                                />
                            </Container>
                        )}
                </div>
            ))}
            <Chiefs />
        </>
    );
};

const Chiefs = () => {
    const { data: electionState } = useElectionState();

    const allChiefs = electionState?.board || [];
    // electionState?.board.concat([electionState?.lead_representative]) || [];
    console.info("allChiefs:");
    console.info(allChiefs);
    const { data: chiefsAsMembers } = useMemberListByAccountNames(
        allChiefs,
        Boolean(allChiefs?.length)
    );
    console.info("chiefsAsMembers:");
    console.info(chiefsAsMembers);

    const nftTemplateIds = chiefsAsMembers?.map(
        (member) => member.nft_template_id
    );

    const { data: members } = useQuery({
        ...queryMembers(1, allChiefs.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: Boolean(chiefsAsMembers?.length),
    });

    console.info("members:");
    console.info(members);

    return (
        <>
            <div>PLACEHOLDER: Chiefs and Head Chief here</div>
            <pre>{JSON.stringify(members, null, 2)}</pre>
        </>
    );
};

export default DelegatesPage;
