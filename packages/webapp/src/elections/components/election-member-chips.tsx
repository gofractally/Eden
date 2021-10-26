import React from "react";
import { FaCheckSquare, FaPlayCircle, FaRegSquare } from "react-icons/fa";

import {
    ipfsUrl,
    openInNewTab,
    useChiefDelegates,
    useHeadDelegate,
} from "_app";
import { ROUTES } from "_app/routes";
import { GenericMemberChip, OpensInNewTabIcon } from "_app/ui";
import { MemberData } from "members/interfaces";
import { getValidSocialLink } from "members/helpers/social-links";
import { MemberChipTelegramLink } from "members/components/member-chip-components";

interface VotingMemberChipProps {
    member: MemberData;
    onSelect?: () => void;
    isSelected?: boolean;
    hasCurrentMembersVote?: boolean;
    isDelegate?: boolean;
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
    hasCurrentMembersVote,
    votesReceived,
    votingFor,
    electionVideoCid,
    isDelegate,
    ...containerProps
}: VotingMemberChipProps) => {
    const goToMemberPage = (e: React.MouseEvent) => {
        if (!member) return;
        e.stopPropagation();
        window.open(`${ROUTES.MEMBERS.href}/${member.account}`, "_blank");
    };

    const telegramHandle = getValidSocialLink(member.socialHandles.telegram);

    return (
        <GenericMemberChip
            member={member}
            isDelegate={isDelegate}
            contentComponent={
                <div
                    onClick={goToMemberPage}
                    className="flex-1 flex flex-col justify-center"
                >
                    <div className="flex xs:space-x-1">
                        <MemberChipTelegramLink
                            handle={member.socialHandles.telegram}
                            className="hidden xs:block"
                        />
                        {telegramHandle && votesReceived > 0 && (
                            <p className="hidden xs:block text-xs text-gray-600 font-light">
                                •
                            </p>
                        )}
                        {votesReceived > 0 && (
                            <p className="text-xs text-blue-500 font-medium">
                                Votes Received: {votesReceived}
                            </p>
                        )}
                    </div>
                    <p className="flex hover:underline">
                        {member.name}
                        <OpensInNewTabIcon className="mt-0.5" />
                    </p>
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
                    {onSelect && (
                        <VotingSelectionIcons
                            hasCurrentMembersVote={hasCurrentMembersVote}
                            isSelected={isSelected}
                        />
                    )}
                </div>
            }
            onClickChip={onSelect}
            {...containerProps}
        />
    );
};

interface VotingSelectionIconsProps {
    hasCurrentMembersVote?: boolean;
    isSelected?: boolean;
}
const VotingSelectionIcons = ({
    hasCurrentMembersVote,
    isSelected,
}: VotingSelectionIconsProps) =>
    hasCurrentMembersVote ? (
        <FaCheckSquare size={31} className="ml-4 mr-2 text-gray-400" />
    ) : isSelected ? (
        <FaCheckSquare size={31} className="ml-4 mr-2 text-blue-500" />
    ) : (
        <FaRegSquare
            size={31}
            className="ml-4 mr-2 text-gray-300 hover:text-gray-400"
        />
    );

const getDelegateLevelDescription = (
    memberAccount: string | undefined,
    level: number | undefined
) => {
    if (!memberAccount || !level) return "Delegate";
    const { data: headDelegate } = useHeadDelegate();
    const { data: chiefDelegates } = useChiefDelegates();

    const prefix = "D" + (level - 1);
    if (level === 1) return "Member";
    if (headDelegate === memberAccount) return prefix + " - Head Chief";
    if (chiefDelegates?.includes(memberAccount))
        return prefix + " - Chief Delegate";

    return prefix;
};

interface DelegateChipProps {
    member?: MemberData;
    level?: number;
    delegateTitle?: string;
    electionVideoCid?: string;
}

export const DelegateChip = ({
    member,
    level,
    delegateTitle,
    electionVideoCid,
}: DelegateChipProps) => (
    <ElectionParticipantChip
        member={member}
        delegateLevel={
            delegateTitle ?? getDelegateLevelDescription(member?.account, level)
        }
        electionVideoCid={electionVideoCid}
        isDelegate
    />
);

interface ElectionParticipantChipProps {
    member?: MemberData;
    delegateLevel?: string;
    isDelegate?: boolean;
    electionVideoCid?: string;
    subText?: string;
}

export const ElectionParticipantChip = ({
    member,
    delegateLevel,
    isDelegate = false,
    electionVideoCid,
    subText,
}: ElectionParticipantChipProps) => {
    const goToMemberPage = (e: React.MouseEvent) => {
        if (!member) return;
        e.stopPropagation();
        window.open(`${ROUTES.MEMBERS.href}/${member.account}`, "_blank");
    };

    if (!member) {
        return (
            <div
                className="p-2.5 select-none border-b"
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
                <div className="flex-1 flex flex-col justify-center">
                    <MemberChipTelegramLink
                        handle={member.socialHandles.telegram}
                    />
                    <p className="flex hover:underline">
                        {member.name}
                        <OpensInNewTabIcon className="mt-0.5" />
                    </p>
                    {(delegateLevel || subText) && (
                        <p className="text-xs text-gray-500 font-light">
                            {subText ?? delegateLevel}
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
