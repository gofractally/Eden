import { useRouter } from "next/router";
import { FaCheckSquare, FaRegSquare, FaStar } from "react-icons/fa";

import { ROUTES } from "_app/config";
import { GenericMemberChip } from "_app/ui";
import { MemberData } from "members/interfaces";

interface VotingProps {
    member: MemberData;
    onSelect: () => void;
    isSelected: boolean;
}

export const VotingMemberChip = ({
    member,
    onSelect,
    isSelected,
}: VotingProps) => {
    const router = useRouter();

    const goToMemberPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
    };

    return (
        <GenericMemberChip
            member={member}
            contentComponent={
                <MemberDetails member={member} onClick={goToMemberPage} />
            }
            actionComponent={
                isSelected ? (
                    <FaCheckSquare size={31} className="mr-2 text-blue-500" />
                ) : (
                    <FaRegSquare
                        size={31}
                        className="mr-2 text-gray-300 hover:text-gray-400"
                    />
                )
            }
            onClickChip={onSelect}
        />
    );
};

export const WinningMemberChip = ({ member }: { member: MemberData }) => {
    const router = useRouter();

    const goToMemberPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
    };

    return (
        <GenericMemberChip
            member={member}
            contentComponent={<MemberDetails member={member} />}
            actionComponent={<WinnerBadge />}
            onClickChip={goToMemberPage}
        />
    );
};

const WinnerBadge = () => (
    <div className="flex justify-center items-center rounded-full mr-2 p-1 border border-yellow-800 bg-yellow-500">
        <FaStar size={15} className="text-white" />
    </div>
);

interface MemberDetailsProps {
    member: MemberData;
    onClick?: (e: React.MouseEvent) => void;
}

export const MemberDetails = ({ member, onClick }: MemberDetailsProps) => (
    <div
        onClick={onClick}
        className="flex-1 flex flex-col justify-center group"
    >
        <p className="text-xs text-gray-500 font-light">@{member.account}</p>
        <p className="group-hover:underline">{member.name}</p>
    </div>
);
