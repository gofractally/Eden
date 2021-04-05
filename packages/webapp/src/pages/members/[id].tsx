import { GetServerSideProps } from "next";

import { Heading } from "ui";
import { getMember, MemberCard, MemberCollections, MemberData } from "members";

interface Props {
    member: MemberData;
}

export const MemberPage = ({ member }: Props) => {
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="px-8 pt-8">
                <Heading>EdenOS Member Profile</Heading>
                <hr />
            </div>
            <MemberCard member={member} />
            <MemberCollections
                edenAccount={member.edenAccount}
                templateId={member.templateId}
            />
        </div>
    );
};

export default MemberPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        const edenAccount = params.id as string;
        const member = await getMember(edenAccount);
        console.info(member);
        return { props: { member } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
};
