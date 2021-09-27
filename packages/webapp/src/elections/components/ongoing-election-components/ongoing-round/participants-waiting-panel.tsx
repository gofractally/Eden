import React from "react";
import { MemberData } from "members/interfaces";
import { ElectionParticipantChip } from "elections";

interface ParticipantsWaitingPanelProps {
    members?: MemberData[];
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
