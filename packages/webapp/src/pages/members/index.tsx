import { GetServerSideProps } from "next";

import { getMembers, MembersGrid, MemberData } from "members";
import { SingleColLayout } from "_app";

interface Props {
    members: MemberData[];
    error?: string;
}

export const Members = ({ members, error }: Props) => {
    return (
        <SingleColLayout title="Community Members">
            {error || <MembersGrid members={members} />}
        </SingleColLayout>
    );
};

export default Members;

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        const members = await getMembers();
        console.info(members);
        return { props: { members } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
};
