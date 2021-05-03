import { GetServerSideProps } from "next";

import { getMembers, MembersGrid, MemberData, getNewMembers } from "members";
import { SingleColLayout, Card } from "_app";

interface Props {
    members: MemberData[];
    newMembers: MemberData[];
    error?: string;
}

export const Members = ({ members, newMembers, error }: Props) => {
    return (
        <SingleColLayout>
            {error || (
                <>
                    <Card title="New Members" titleSize={2}>
                        <MembersGrid members={newMembers} />
                    </Card>
                    <Card title="All Members" titleSize={2}>
                        <MembersGrid members={members} />
                    </Card>
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
