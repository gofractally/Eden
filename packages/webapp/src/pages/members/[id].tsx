import { GetServerSideProps } from "next";

import { CallToAction, Card, RawLayout, SingleColLayout } from "_app";
import {
    getMember,
    MemberCard,
    MemberCollections,
    MemberData,
    MemberHoloCard,
} from "members";

interface Props {
    member?: MemberData;
}

export const MemberPage = ({ member }: Props) => {
    return member ? (
        <RawLayout title={`${member.name}'s Profile`}>
            <Card>
                <div className="flex justify-center items-center space-y-10 xl:space-y-0 xl:space-x-10 flex-col xl:flex-row">
                    <div className="max-w-xl">
                        <MemberHoloCard member={member} />
                    </div>
                    <MemberCard member={member} />
                </div>
            </Card>
            <MemberCollections
                account={member.account}
                templateId={member.templateId}
            />
        </RawLayout>
    ) : (
        <SingleColLayout title="Member not found">
            <CallToAction href="/members" buttonLabel="Browse members">
                This account is not an active Eden member.
            </CallToAction>
        </SingleColLayout>
    );
};

export default MemberPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        const account = params!.id as string;
        const member = await getMember(account);
        return { props: { member: member || null } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
};
