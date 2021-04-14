import { GetServerSideProps } from "next";

import { Link, RawLayout } from "_app";
import { getMember, MemberCard, MemberCollections, MemberData } from "members";

interface Props {
    member?: MemberData;
}

export const MemberPage = ({ member }: Props) => {
    return member ? (
        <RawLayout title={`${member.name}'s Profile`}>
            <div className="ml-8 mt-1 text-sm">
                <Link href="/members">Back to Members List</Link>
            </div>

            <MemberCard member={member} />
            <MemberCollections
                edenAccount={member.edenAccount}
                templateId={member.templateId}
            />
        </RawLayout>
    ) : (
        <RawLayout title="Member not found">
            <div className="text-center max-w">:(</div>
        </RawLayout>
    );
};

export default MemberPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        const edenAccount = params!.id as string;
        const member = await getMember(edenAccount);
        console.info(member);
        return { props: { member: member || null } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
};
