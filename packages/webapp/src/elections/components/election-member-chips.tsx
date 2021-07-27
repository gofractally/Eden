import { useRouter } from "next/router";
import { FaCheckSquare, FaRegSquare } from "react-icons/fa";

import { ROUTES } from "_app/config";
import { GenericMemberChip } from "_app/ui";
import { MemberData } from "members/interfaces";

interface VotingMemberChipProps {
    member: MemberData;
    onSelect: () => void;
    isSelected: boolean;
    votesReceived: number;
    votingFor?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const VotingMemberChip = ({
    member,
    onSelect,
    isSelected,
    votesReceived,
    votingFor,
    ...containerProps
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
                <div
                    onClick={goToMemberPage}
                    className="flex-1 flex flex-col justify-center group"
                >
                    {votesReceived > 0 && (
                        <p className="text-xs text-blue-500 font-medium">
                            Votes Received: {votesReceived}
                        </p>
                    )}
                    <p className="group-hover:underline">{member.name}</p>
                    {votingFor && (
                        <p className="text-xs text-gray-500">
                            Voting for {votingFor}
                        </p>
                    )}
                </div>
            }
            actionComponent={
                isSelected ? (
                    <FaCheckSquare size={31} className="mr-2 text-blue-500" />
                ) : (
                    <FaRegSquare
                        size={31}
                        className="mr-2 text-gray-400 hover:text-gray-500"
                    />
                )
            }
            onClickChip={onSelect}
            {...containerProps}
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
            contentComponent={
                <div className="flex-1 flex flex-col justify-center group">
                    <p className="text-xs text-gray-500 font-light">
                        @{member.account}
                    </p>
                    <p className="group-hover:underline">{member.name}</p>
                    {level && (
                        <p className="text-xs text-gray-500 font-light">
                            {level}
                        </p>
                    )}
                </div>
            }
            onClickChip={goToMemberPage}
        />
    );
};
