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
    useMemberStats,
    useMyDelegation,
    useUALAccount,
} from "_app";
import { DelegateChip } from "elections";
import { EdenMember, MemberData } from "members/interfaces";
import dayjs from "dayjs";

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

const Delegates = ({
    members,
    myDelegation,
}: {
    members?: MemberData[];
    myDelegation: EdenMember[];
}) => {
    const { data: membersStats } = useMemberStats();

    if (myDelegation?.length === 0) {
        return (
            <div className="-mt-px">
                <DelegateChip />
            </div>
        );
    }
    if (!members || !membersStats) return <></>;

    return (
        <>
            {myDelegation.map((delegate, index) => (
                <div
                    className="-mt-px"
                    key={`my-delegation-${members[index].account}`}
                >
                    <DelegateChip
                        member={members.find(
                            (d) => d.account === delegate.account
                        )}
                        level={delegate.election_rank}
                    />
                    {delegate.election_rank < membersStats?.ranks.length && (
                        <Container className="py-2.5">
                            <BsArrowDown
                                size={28}
                                className="ml-3.5 text-gray-400"
                            />
                        </Container>
                    )}
                </div>
            ))}
        </>
    );
};

export default DelegatesPage;
