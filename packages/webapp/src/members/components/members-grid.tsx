import React from "react";
import { MemberData } from "../interfaces";

interface Props {
    members?: MemberData[];
    dataTestId?: string;
    children(
        value: MemberData,
        index: number,
        array: MemberData[]
    ): React.ReactNode;
}

export const MembersGrid = ({ members, dataTestId, children }: Props) => {
    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px"
            data-testid={dataTestId}
        >
            {members?.length ? members.map(children) : "No members to list."}
        </div>
    );
};

export default MembersGrid;
