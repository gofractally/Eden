import React from "react";
import dayjs from "dayjs";

import { Container, Heading, Text } from "_app/ui";
import {
    ActiveStateConfigType,
    RoundStage,
    VoteData,
} from "elections/interfaces";

import { Consensometer } from "./round-info";
import { MeetingLink } from "./round-info/meeting-link";
import { VideoUploadButton } from "../video-upload-button";

interface RoundInfoPanelProps {
    stage: RoundStage;
    roundIndex: number;
    meetingStartTime: dayjs.Dayjs;
    electionConfig?: ActiveStateConfigType;
    voteData?: VoteData[];
    isVotingOpen: boolean;
}

export const RoundInfoPanel = ({
    stage,
    roundIndex,
    meetingStartTime,
    electionConfig,
    voteData,
    isVotingOpen,
}: RoundInfoPanelProps) => {
    return (
        <Container className="flex flex-col space-y-4">
            <section className="lg:order-3 lg:my-4 space-y-4">
                {[RoundStage.PreMeeting, RoundStage.Meeting].includes(
                    stage
                ) && (
                    <div>
                        <MeetingLink
                            stage={stage}
                            roundIndex={roundIndex}
                            meetingStartTime={meetingStartTime}
                            electionConfig={electionConfig!}
                        />
                    </div>
                )}
                {[RoundStage.Meeting, RoundStage.PostMeeting].includes(
                    stage
                ) && (
                    <div className="hidden lg:block">
                        <VideoUploadButton buttonType="secondary" />
                    </div>
                )}
            </section>
            <section className="lg:order-1">
                <Heading size={3}>Meeting group members</Heading>
                <Text>
                    {stage === RoundStage.PreMeeting
                        ? "Make sure you have your meeting link ready and stand by. You'll be on a video call with the following Eden members momentarily."
                        : stage === RoundStage.Meeting
                        ? "Meet with your group. Align on a leader >2/3 majority. Select your leader and submit your vote below."
                        : stage === RoundStage.Complete
                        ? "If you're the delegate elect, stand by. The next round will start momentarily."
                        : "This round is finalizing. Please submit any outstanding votes now. You will be able to come back later to upload election videos if your video isn't ready yet."}
                </Text>
            </section>
            <section className="lg:order-2">
                {voteData && isVotingOpen && (
                    <Consensometer voteData={voteData} />
                )}
            </section>
        </Container>
    );
};

export default RoundInfoPanel;
