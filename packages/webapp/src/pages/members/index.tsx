import React from "react";

import { SideNavLayout } from "_app";
import { MembersList } from "members/components/home";

export const MembersPage = () => (
    <SideNavLayout title="Community" className="relative">
        <MembersList />
    </SideNavLayout>
);

export default MembersPage;
