import { GetServerSideProps } from "next";

import { Heading } from "ui";
import { getMembers, MembersGrid, MemberData } from "members";

interface Props {
    members: MemberData[];
    error?: string;
}

export const Members = ({ members, error }: Props) => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="px-8 pt-8">
                <Heading>EdenOS Members List</Heading>
                <hr />
            </div>
            <div className="px-5 py-5 mx-auto flex justify-around">
                <div className="bg-white rounded-lg p-8 w-full mt-0 md:mt-0 shadow-md">
                    {error || <MembersGrid members={members} />}
                </div>
            </div>
        </div>
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
