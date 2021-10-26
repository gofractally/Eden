import { useRouter } from "next/router";
import { useQuery } from "react-query";

import {
    CallToAction,
    Container,
    SideNavLayout,
    LoadingCard,
    queryMemberData,
} from "_app";
import { ROUTES } from "_app/routes";

import { MemberCard, MemberCollections, MemberHoloCard } from "members";
import { DelegateFundsAvailable } from "delegates/components";

export const MemberPage = () => {
    const router = useRouter();
    const { account } = router.query;
    const { data: member, isLoading } = useQuery(
        queryMemberData(account as string)
    );

    if (member) {
        return (
            <SideNavLayout
                title={`${member.name}'s Profile`}
                className="divide-y"
            >
                <DelegateFundsAvailable account={account as string} />
                <Container className="space-y-2.5">
                    <div className="flex items-center space-y-10 xl:space-y-0 xl:space-x-4 flex-col">
                        <div className="max-w-xl">
                            <MemberHoloCard member={member} />
                        </div>
                        <MemberCard member={member} showBalance />
                    </div>
                </Container>
                <MemberCollections member={member} />
            </SideNavLayout>
        );
    }

    if (isLoading) {
        return (
            <SideNavLayout title="Loading member details...">
                <LoadingCard />
            </SideNavLayout>
        );
    }

    return (
        <SideNavLayout title="Member not found">
            <CallToAction
                href={ROUTES.MEMBERS.href}
                buttonLabel="Browse members"
            >
                This account is not an active Eden member.
            </CallToAction>
        </SideNavLayout>
    );
};

export default MemberPage;
