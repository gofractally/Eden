import React from "react";
import { GoSync } from "react-icons/go";

import { MemberStatus, useCurrentMember } from "_app";
import { ROUTES } from "_app/routes";
import { Button, Container, Expander, OpensInNewTabIcon, Text } from "_app/ui";
import { ElectionCommunityRoomButton } from "elections";

export const SupportSegment = () => {
    const { data: currentMember } = useCurrentMember();
    const isActiveMember = currentMember?.status === MemberStatus.ActiveMember;

    return (
        <Expander
            type="info"
            header={
                <div className="flex justify-center items-center space-x-2">
                    <GoSync size={24} className="text-gray-400" />
                    <Text className="font-semibold">
                        Community room &amp; live results
                    </Text>
                </div>
            }
        >
            <Container>
                <div className="flex justify-between sm:justify-start items-center space-x-4">
                    <ElectionCommunityRoomButton />
                    <Button
                        type="link"
                        href={ROUTES.ELECTION_STATS.href}
                        target="_blank"
                    >
                        Live results <OpensInNewTabIcon />
                    </Button>
                </div>
                <Text className="mt-3" type="note">
                    <span className="font-semibold text-gray-600">Note:</span>{" "}
                    The{" "}
                    <span className="font-semibold">Join community room</span>{" "}
                    button will take you directly to a{" "}
                    <span className="italic">Telegram message</span> in the
                    private Eden Members Telegram group.{" "}
                    <span className="underline">
                        That Telegram message contains the Zoom link.
                    </span>{" "}
                    You must be a member of the Eden Members Telegram group to
                    retrieve this Zoom link.
                </Text>
            </Container>
        </Expander>
    );
};

export default SupportSegment;
