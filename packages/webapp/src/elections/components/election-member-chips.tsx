import { useRouter } from "next/router";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";

import { ROUTES } from "_app/config";
import { GenericMemberChip } from "_app/ui";
import { MemberData } from "members/interfaces";

interface VotingMemberChipProps {
    member: MemberData;
    onSelect: () => void;
    isSelected: boolean;
}

export const VotingMemberChip = ({
    member,
    onSelect,
    isSelected,
}: VotingMemberChipProps) => {
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

interface DelegateChipProps {
    member: MemberData;
    level?: string;
}

export const DelegateChip = ({ member, level }: DelegateChipProps) => {
    const router = useRouter();

    const goToMemberPage = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
    };

    return (
        <GenericMemberChip
            member={member}
            isDelegate={true} // TODO: This will be inferred from member
            contentComponent={<MemberDetails member={member} subText={level} />}
            onClickChip={goToMemberPage}
        />
    );
};

interface MemberDetailsProps {
    member: MemberData;
    subText?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const MemberDetails = ({
    member,
    subText,
    onClick,
}: MemberDetailsProps) => (
    <div
        onClick={onClick}
        className="flex-1 flex flex-col justify-center group"
    >
        <p className="text-xs text-gray-500 font-light">@{member.account}</p>
        <p className="group-hover:underline font-medium">{member.name}</p>
        {subText && (
            <p className="text-xs text-gray-500 font-light">{subText}</p>
        )}
    </div>
);
