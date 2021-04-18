import { GetServerSideProps } from "next";

import { RawLayout, SingleColLayout, useFetchedData } from "_app";
import { getMember, getInduction, Induction } from "members";
import { InductionProfileForm } from "members/components/induction-profile-form";

interface Props {
    inductionId?: string;
}

export const MemberPage = ({ inductionId }: Props) => {
    const [induction, isLoading] = useFetchedData<Induction>(
        getInduction,
        inductionId
    );

    return isLoading ? (
        <p>Loading Induction...</p>
    ) : induction ? (
        <SingleColLayout title={`Induction #${inductionId}`}>
            <div className="text-lg mb-4 text-gray-900">
                Phase 1/3: Waiting for New Member Profile
            </div>
            <InductionProfileForm
                newMemberProfile={induction.new_member_profile}
                disabled={true}
            />
        </SingleColLayout>
    ) : (
        <RawLayout title="Induction not found">
            <div className="text-center max-w p-8">
                <p>:(</p>
                <p>
                    Perhaps this induction was expired after 7 days? Or the
                    invitee was approved through another induction process.
                </p>
            </div>
        </RawLayout>
    );
};

export default MemberPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        const inductionId = params!.id as string;
        return { props: { inductionId: inductionId || null } };
    } catch (error) {
        console.error(">>> Fail to parse induction id: " + error);
        return { props: { error: "Fail to get induction id" } };
    }
};
