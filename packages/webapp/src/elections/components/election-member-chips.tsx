import { useRouter } from "next/router";
import { FaCheckSquare, FaPlayCircle, FaRegSquare } from "react-icons/fa";

import { ipfsUrl, openInNewTab } from "_app";
import { ROUTES } from "_app/config";
import { GenericMemberChip } from "_app/ui";
import { MemberData } from "members/interfaces";

interface VotingMemberChipProps {
    member: MemberData;
    onSelect: () => void;
    isSelected: boolean;
    votesReceived: number;
    votingFor?: string;
    electionVideoCid?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const VotingMemberChip = ({
    member,
    onSelect,
    isSelected,
    votesReceived,
    votingFor,
    electionVideoCid,
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
                <div className="flex items-center">
                    <ElectionVideoPlayButton
                        electionVideoCid={electionVideoCid}
                    />
                    {isSelected ? (
                        <FaCheckSquare
                            size={31}
                            className="ml-4 mr-2 text-blue-500"
                        />
                    ) : (
                        <FaRegSquare
                            size={31}
                            className="ml-4 mr-2 text-gray-400 hover:text-gray-500"
                        />
                    )}
                </div>
            }
            onClickChip={onSelect}
            {...containerProps}
        />
    );
};

interface DelegateChipProps {
    member?: MemberData;
    level?: string;
}

export const DelegateChip = ({ member, level }: DelegateChipProps) => (
    <ElectionParticipantChip
        member={member!}
        delegateLevel={level}
        isDelegate
    />
);

interface ElectionParticipantChipProps {
    member?: MemberData;
    delegateLevel?: string;
    isDelegate?: boolean;
    electionVideoCid?: string;
}

export const ElectionParticipantChip = ({
    member,
    delegateLevel,
    isDelegate = false,
    electionVideoCid,
}: ElectionParticipantChipProps) => {
    const router = useRouter();

    const goToMemberPage = (e: React.MouseEvent) => {
        if (!member) return;
        e.stopPropagation();
        router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
    };

    if (!member) {
        return (
            <div
                className="p-2.5 select-none"
                style={{ boxShadow: "0 0 0 1px #e5e5e5" }}
            >
                <div className="flex items-center space-x-2.5">
                    <div className="rounded-full h-14 w-14 bg-gray-300" />
                    <div className="text-gray-300">No delegates chosen</div>
                </div>
            </div>
        );
    }

    return (
        <GenericMemberChip
            member={member}
            isDelegate={isDelegate || Boolean(delegateLevel)} // TODO: This will be inferred from member
            contentComponent={
                <div className="flex-1 flex flex-col justify-center group">
                    <p className="text-xs text-gray-500 font-light">
                        @{member.account}
                    </p>
                    <p className="group-hover:underline">{member.name}</p>
                    {delegateLevel && (
                        <p className="text-xs text-gray-500 font-light">
                            {delegateLevel}
                        </p>
                    )}
                </div>
            }
            actionComponent={
                <ElectionVideoPlayButton electionVideoCid={electionVideoCid} />
            }
            onClickChip={goToMemberPage}
        />
    );
};

const ElectionVideoPlayButton = ({
    electionVideoCid,
}: {
    electionVideoCid?: string;
}) => {
    if (!electionVideoCid) return <></>;
    return (
        <FaPlayCircle
            size={26}
            className="mr-2 text-blue-500 hover:text-blue-600 active:text-blue-700"
            onClick={(e) => {
                e.stopPropagation();
                openInNewTab(ipfsUrl(electionVideoCid));
            }}
        />
    );
};
