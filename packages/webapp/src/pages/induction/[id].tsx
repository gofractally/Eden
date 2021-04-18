import { GetServerSideProps } from "next";

import { RawLayout, useFetchedData } from "_app";
import { getMember, getInduction } from "members";

interface Props {
    inductionId?: string;
}

export const MemberPage = ({ inductionId }: Props) => {
    const [induction, isLoading] = useFetchedData(getInduction, inductionId);

    return isLoading ? (
        <p>Loading Induction...</p>
    ) : induction ? (
        <RawLayout title={`Induction #${inductionId}`}>
            todo: show induction stuff...
        </RawLayout>
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
