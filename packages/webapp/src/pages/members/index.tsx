import React from "react";

import { PageSearchHeaders, SideNavLayout, useFormFields } from "_app";
import { MembersList } from "members/components/home";

export const MembersPage = () => {
    const [fields, setFields] = useFormFields({
        memberSearch: "",
    });

    const search = (e: React.ChangeEvent<HTMLInputElement>) => setFields(e);
    const clear = () =>
        setFields({ target: { id: "memberSearch", value: "" } });

    return (
        <SideNavLayout title="Community" className="relative">
            <PageSearchHeaders
                header="Community"
                id="memberSearch"
                value={fields.memberSearch}
                onChange={search}
                onClear={clear}
            />
            <MembersList searchValue={fields.memberSearch} />
        </SideNavLayout>
    );
};

export default MembersPage;
