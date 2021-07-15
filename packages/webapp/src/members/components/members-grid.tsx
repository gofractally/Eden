import React from "react";
import { MemberData } from "../interfaces";

interface Props {
    members?: MemberData[];
    children(
        value: MemberData,
        index: number,
        array: MemberData[]
    ): React.ReactNode;
}

export const MembersGrid = ({ members, children }: Props) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
            {members?.length ? members.map(children) : "No members to list."}
        </div>
    );
};

export default MembersGrid;
