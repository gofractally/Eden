import { useQuery } from "react-query";
import { BsArrowDown } from "react-icons/bs";
import dayjs from "dayjs";

import {
    Container,
    FluidLayout,
    Heading,
    queryMembers,
    Link,
    Text,
    useCurrentMember,
    useElectionState,
    useMemberListByAccountNames,
    useMemberStats,
    useMyDelegation,
    useUALAccount,
} from "_app";
import { DelegateChip } from "elections";
import { EdenMember, MemberData, MemberStats } from "members/interfaces";
import { isValidDelegate } from "delegates/api";

interface Props {
    delegatesPage: number;
}

const isDelegateAChief = (delegateRank: number, membersStats: MemberStats) =>
    delegateRank > membersStats.ranks.length - 2;

const isGapInRepresentation = (
    highestRankedMemberInDelegation: EdenMember,
    membersStats: MemberStats
) =>
    !isDelegateAChief(
        highestRankedMemberInDelegation.election_rank + 1,
        membersStats
    ) && !isValidDelegate(highestRankedMemberInDelegation.representative);

export const DelegatesPage = (props: Props) => {
    const [activeUser] = useUALAccount();
    const currentMember = useCurrentMember();
    const { data: myDelegation } = useMyDelegation();
    const { data: electionState } = useElectionState();

    let nftTemplateIds: number[] = [];
    if (myDelegation?.length) {
        nftTemplateIds = myDelegation?.map((member) => member.nft_template_id);
    }

    const { data: members } = useQuery({
        ...queryMembers(1, myDelegation?.length, nftTemplateIds),
        staleTime: Infinity,
        enabled: Boolean(myDelegation?.length),
    });

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
    if (!myDelegation || (myDelegation?.length > 0 && !members))
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
    members?: MemberData[];
    myDelegation: EdenMember[];
}) => {
    const { data: membersStats, isLoading } = useMemberStats();
    const { data: loggedInMember } = useCurrentMember();

    if (isLoading) return <div>Loading...</div>;
    if (!loggedInMember || !membersStats)
        return <div>Error fetching member data...</div>;

    const highestRankedMemberInDelegation = myDelegation.length
        ? myDelegation[myDelegation.length - 1]
        : loggedInMember;

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
                    <MyDelegationArrow />
                </div>
            ))}
            {isGapInRepresentation(
                highestRankedMemberInDelegation,
                membersStats
            ) && (
                <div className="-mt-px">
                    <DelegateChip />
                    <MyDelegationArrow />
                </div>
            )}
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
                if (
                    !delegate ||
                    delegate.account === electionState.lead_representative
                )
                    return null;
                return (
                    <div className="-mt-px" key={`chiefs-${delegate.account}`}>
                        <DelegateChip
                            member={members.find(
                                (d) => d.account === delegate.account
                            )}
                            level={delegate.election_rank}
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
                level={headChiefAsEdenMember.election_rank}
            />
        </>
    );
};

export default DelegatesPage;
