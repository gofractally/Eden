import { useRouter } from "next/router";

import {
    CallToAction,
    Card,
    RawLayout,
    SingleColLayout,
    useIsCommunityActive,
} from "_app";
import {
    getInductionStatus,
    InductionJourneyContainer,
    InductionStatus,
    useGetInductionWithEndorsements,
} from "inductions";

export const InductionDetailsPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    const { isLoading: isLoadingCommunityState } = useIsCommunityActive();

    const {
        data,
        isLoading: isLoadingEndorsements,
    } = useGetInductionWithEndorsements(inductionId as string);

    const isLoading = isLoadingEndorsements || isLoadingCommunityState;

    const induction = data?.induction;
    const endorsements = data?.endorsements || [];

    const status = getInductionStatus(induction, endorsements);

    const notFound =
        status === InductionStatus.Invalid ||
        status === InductionStatus.Expired;

    if (!isLoading && notFound) {
        return (
            <RawLayout title="Invite not found">
                <CallToAction
                    href="/induction"
                    buttonLabel="Membership Dashboard"
                >
                    Hmmm... this invitation couldn't be found. The invitee may
                    have already been inducted, or their invitation could have
                    expired.
                </CallToAction>
            </RawLayout>
        );
    }

    return (
        <SingleColLayout
            title={isLoading ? "Loading" : `Induction #${inductionId}`}
        >
            {isLoading ? (
                <Card title="Loading...">...</Card>
            ) : (
                induction && (
                    <InductionJourneyContainer
                        induction={induction}
                        endorsements={endorsements}
                        status={status}
                    />
                )
            )}
        </SingleColLayout>
    );
};

export default InductionDetailsPage;
