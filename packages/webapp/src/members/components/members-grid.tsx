import React from "react";
import { Member, MemberNFT } from "../interfaces";

interface Props {
    members?: Member[] | MemberNFT[];
    dataTestId?: string;
    children(
        value: Member | MemberNFT,
        index: number,
        array: Member[] | MemberNFT[]
    ): React.ReactNode;
    maxCols?: 1 | 2 | 3;
}

export const MembersGrid = ({
    members,
    maxCols = 3,
    dataTestId,
    children,
}: Props) => {
    let containerClass =
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px";

    if (maxCols === 2) {
        containerClass = "grid grid-cols-1 md:grid-cols-2 gap-px";
    }

    if (maxCols === 1) {
        containerClass = "grid grid-cols-1 gap-px";
    }

    return (
        <div className={containerClass} data-testid={dataTestId}>
            {members?.length ? members.map(children) : "No members to list."}
        </div>
    );
};

export default MembersGrid;
