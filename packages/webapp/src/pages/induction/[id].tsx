import { useRouter } from "next/router";

import {
    CallToAction,
    Card,
    SideNavLayout,
    useIsCommunityActive,
    useUALAccount,
} from "_app";
import { ROUTES } from "_app/routes";

import {
    getInductionStatus,
    InductionJourneyContainer,
    InductionStatus,
    useGetInductionWithEndorsements,
} from "inductions";

export const InductionDetailsPage = () => {
    const router = useRouter();
    const inductionId = router.query.id;

    // refetches inductions query on sign in (in case previously cleared on sign out)
    useUALAccount(); // see https://github.com/eoscommunity/Eden/pull/239

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
            <SideNavLayout title="Invite not found">
                <CallToAction
                    href={ROUTES.INDUCTION.href}
                    buttonLabel="Membership Dashboard"
                >
                    Hmmm... this invitation couldn't be found. The invitee may
                    have already been inducted, or their invitation could have
                    expired.
                </CallToAction>
            </SideNavLayout>
        );
    }

    return (
        <SideNavLayout
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
        </SideNavLayout>
    );
};

export default InductionDetailsPage;
