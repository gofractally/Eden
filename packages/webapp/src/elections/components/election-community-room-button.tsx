import React from "react";
import { BiWebcam } from "react-icons/bi";

import { election as electionConfig } from "config";
import { Button, OpensInNewTabIcon } from "_app/ui";

export const ElectionCommunityRoomButton = () => (
    <Button
        size="sm"
        disabled={!electionConfig.communityRoomUrl}
        href={electionConfig.communityRoomUrl}
        title="Election community video conference room"
        target="_blank"
        isExternal
    >
        <BiWebcam className="mr-1" />
        Join community room
        <OpensInNewTabIcon />
    </Button>
);

export default ElectionCommunityRoomButton;
