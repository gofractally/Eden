import { useQuery } from "react-query";
import { BsArrowDown } from "react-icons/bs";

import {
    Container,
    FluidLayout,
    Heading,
    MemberStatus,
    queryMembers,
    Text,
    useMemberStats,
    useMyDelegation,
} from "_app";
import { DelegateChip } from "elections";
import { EdenMember, MemberData } from "members/interfaces";

interface Props {
    delegatesPage: number;
}

const MEMBERS_PAGE_SIZE = 4;

// TODO: Hook up to fixture data
export const DelegatesPage = (props: Props) => {
    const { data: members } = useQuery({
        ...queryMembers(1, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const { data: myDelegation } = useMyDelegation();

    if (!myDelegation) return <div>fetching your Delegation...</div>;

    return (
        <FluidLayout title="My Delegation">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>My Delegation</Heading>
                    <Text size="sm">Elected September 14, 2021</Text>
                </Container>
                <Delegates myDelegation={myDelegation} members={members} />
                <Container>
                    <Heading size={3}>No delegate example...</Heading>
                </Container>
                <div className="-mt-px">
                    <DelegateChip />
                </div>
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
