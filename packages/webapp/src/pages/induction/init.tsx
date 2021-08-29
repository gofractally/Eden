import React from "react";
import {
    CallToAction,
    Card,
    MemberStatus,
    SideNavLayout,
    useCurrentMember,
    useUALAccount,
} from "_app";
import { GetAnInviteCTA, InductionInviteFormContainer } from "inductions";

export const InitInductionPage = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const { data: member, isLoading } = useCurrentMember();

    const getPageTitle = () => {
        if (!ualAccount) return "Sign in";
        if (member?.status !== MemberStatus.ActiveMember) return "Membership";
        return "Invite";
    };

    const renderContents = () => {
        if (!ualAccount) {
            return (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            );
        }

        if (isLoading) {
            return <Card title="Loading...">...</Card>;
        }

        if (member?.status !== MemberStatus.ActiveMember) {
            return <GetAnInviteCTA />;
        }

        return <InductionInviteFormContainer ualAccount={ualAccount} />;
    };

    return (
        <SideNavLayout title={getPageTitle()}>{renderContents()}</SideNavLayout>
    );
};

export default InitInductionPage;
