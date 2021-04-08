import { GetServerSideProps } from "next";

import { getMembers, MembersGrid, MemberData, getNewMembers } from "members";
import { Heading, SingleColLayout, Text } from "_app";

interface Props {
    members: MemberData[];
    newMembers: MemberData[];
    error?: string;
}

export const Members = ({ members, newMembers, error }: Props) => {
    return (
        <SingleColLayout title="Community Members">
            {error || (
                <>
                    <Heading size={2}>New Members</Heading>
                    <MembersGrid members={newMembers} />
                    <div className="p-8">
                        <hr />
                    </div>
                    <Heading size={2}>Members List</Heading>
                    <MembersGrid members={members} />
                </>
            )}
        </SingleColLayout>
    );
};

export default Members;

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        const [members, newMembers] = await Promise.all([
            getMembers(),
            getNewMembers(),
        ]);
        return { props: { members, newMembers } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
};
