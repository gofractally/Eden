import React, { useState } from "react";

import {
    ActionButton,
    ActionButtonSize,
    Card,
    Heading,
    Link,
    onError,
    Text,
    useUALAccount,
} from "_app";
import {
    convertPendingProfileToMemberData,
    getInductionRemainingTimeDays,
} from "../utils";
import { Endorsement, Induction } from "../interfaces";
import { setInductionVideoTransaction } from "../transactions";
import { InductionVideoForm } from "./induction-video-form";
import { InductionJourneyContainer, InductionRole } from "inductions";
import { MemberCard, MemberData, MemberHoloCard } from "members";

interface Props {
    induction: Induction;
    endorsements: Endorsement[];
    isReviewing?: boolean;
}

export const InductionStepVideo = ({
    induction,
    endorsements,
    isReviewing,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [submittedVideo, setSubmittedVideo] = useState(false);

    const submitInductionVideo = async (videoHash: string) => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionVideoTransaction(
                authorizerAccount,
                induction.id,
                videoHash
            );
            console.info(transaction);
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductvideo trx", signedTrx);
            setSubmittedVideo(true);
        } catch (error) {
            onError(error, "Unable to set the induction video");
        }
    };

    const memberData = convertPendingProfileToMemberData(induction);

    const isEndorser = () =>
        endorsements.find(
            (endorsement) => endorsement.endorser === ualAccount?.accountName
        );

    // Invitee/Endorser: Induction ceremony completion confirmation
    if (submittedVideo) {
        return (
            <>
                <VideoSubmitConfirmation />
                <MemberCardPreview memberData={memberData} />
            </>
        );
    }

    // Invitee/Endorser: Waiting for induction ceremony
    if (isEndorser()) {
        return (
            <>
                <AddUpdateVideoHash
                    induction={induction}
                    onSubmit={submitInductionVideo}
                    isReviewing={isReviewing}
                />
                <MemberCardPreview memberData={memberData} />
            </>
        );
    }

    // Invitee: Waiting for induction ceremony
    return (
        <>
            <WaitingForInductionCeremony induction={induction} />
            <MemberCardPreview memberData={memberData} />
        </>
    );
};

const VideoSubmitConfirmation = () => (
    <InductionJourneyContainer role={InductionRole.INVITER} step={3}>
        <Heading size={1} className="mb-5">
            Received!
        </Heading>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                You attached the induction video.
            </Text>
            <Text className="leading-normal">
                It's time for all witnesses (including the inviter) to endorse
                the prospective member. Now's a good time to reach out to the
                other witnesses to let them know that the invitee is waiting for
                their endorsement.
            </Text>
        </div>
        <ActionButton
            onClick={() => window.location.reload()}
            size={ActionButtonSize.L}
        >
            Onward!
        </ActionButton>
    </InductionJourneyContainer>
);

interface AddUpdateVideoHashProps {
    induction: Induction;
    onSubmit?: (videoHash: string) => Promise<void>;
    isReviewing?: boolean;
}

const AddUpdateVideoHash = ({
    induction,
    onSubmit,
    isReviewing,
}: AddUpdateVideoHashProps) => (
    <InductionJourneyContainer role={InductionRole.INVITER} step={3}>
        <Heading size={1} className="mb-2">
            {isReviewing ? "Review induction video" : "Induction ceremony"}
        </Heading>
        <Text className="mb-8">
            This invitation expires in{" "}
            {getInductionRemainingTimeDays(induction)}.
        </Text>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                It's time for the induction ceremony! The inviter, witnesses and
                prospective Eden member will record a short, scripted video
                conference call inducting the new member.
            </Text>
            <Text className="leading-normal">
                Once complete, upload the recording to IPFS and submit the IPFS
                CID hash below.
            </Text>
        </div>
        <InductionVideoForm video={induction.video} onSubmit={onSubmit} />
    </InductionJourneyContainer>
);

const WaitingForInductionCeremony = ({
    induction,
}: {
    induction: Induction;
}) => (
    <InductionJourneyContainer role={InductionRole.INVITEE} step={3}>
        <Heading size={1} className="mb-5">
            Pending induction ceremony
        </Heading>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                Your inviter or one of the witnesses will be in touch with you
                to schedule a short, recorded video induction ceremony.
            </Text>
            <Text className="leading-normal">
                If you've already completed the ceremony, ask your inviter or a
                witness to attach the video recording here.
            </Text>
            <Text className="leading-normal">
                <span className="font-medium">
                    Remember, this invitation is still open and expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </span>{" "}
                If time runs out, you can always request another invitation.
            </Text>
            <Text className="leading-normal">
                In the meantime, review your Eden profile below.
            </Text>
        </div>
    </InductionJourneyContainer>
);

const MemberCardPreview = ({ memberData }: { memberData: MemberData }) => (
    <Card title="Invitee information" titleSize={2}>
        <div className="flex justify-center items-center space-y-10 xl:space-y-0 xl:space-x-10 flex-col xl:flex-row">
            <div className="max-w-xl">
                <MemberHoloCard member={memberData} inducted={false} />
            </div>
            <MemberCard member={memberData} inducted={false} />
        </div>
    </Card>
);
