import { GetServerSideProps } from "next";

import { RawLayout } from "_app";
import { getMember, MemberCard, MemberCollections, MemberData } from "members";

interface Props {
    member: MemberData;
}

export const MemberPage = ({ member }: Props) => {
    return (
        <RawLayout title={`${member.name}'s Profile`}>
            <MemberCard member={member} />
            <MemberCollections
                edenAccount={member.edenAccount}
                templateId={member.templateId}
            />
        </RawLayout>
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
