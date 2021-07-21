import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";
import { BsArrowDown } from "react-icons/bs";

import { Container, FluidLayout, Heading, queryMembers, Text } from "_app";
import { DelegateChip } from "elections";
import { MemberData } from "members/interfaces";

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();
    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

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

    return (
        <FluidLayout title="My Delegation">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>My Delegation</Heading>
                    <Text size="sm">Elected September 14, 2021</Text>
                </Container>
                <Delegates members={members} />
            </div>
        </FluidLayout>
    );
};

const Delegates = ({ members }: { members?: MemberData[] }) => {
    if (!members) return <></>;
    return (
        <>
            {levels.map((level, index) => (
                <div className="-mt-px">
                    <DelegateChip
                        key={`my-delegation-${members[index].account}`}
                        member={members[index]}
                        level={level}
                    />
                    {levels.length !== index + 1 && (
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

const levels: string[] = [
    "D1 - Your direct delegate",
    "D2",
    "D3 - Chief Delegate",
    "D4 - Head Chief",
];

export default DelegatesPage;
