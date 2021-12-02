import React from "react";

import { ElectionParticipantChip } from "elections";
import { MemberNFT } from "nfts/interfaces";

interface ParticipantsWaitingPanelProps {
    members?: MemberNFT[];
    roundIndex: number;
}

export const ParticipantsWaitingPanel = ({
    members,
    roundIndex,
}: ParticipantsWaitingPanelProps) => (
    <section className="grid grid-cols-1 gap-px">
        {members?.map((member) => (
            <ElectionParticipantChip
                key={`round-${roundIndex + 1}-participant-${member.account}`}
                member={member}
            />
        ))}
    </section>
);

export default ParticipantsWaitingPanel;
