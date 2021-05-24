import React from "react";

import { minimumDonationAmount } from "config";
import { assetToString, Card } from "_app";

import { Step, Steps } from ".";

export type InductionStep =
    | InductionStepGenesis
    | InductionStepInviter
    | InductionStepInvitee;

export enum InductionStepInvitee {
    GetInvite = "invitee-get-invite",
    Profile = "invitee-profile",
    PendingVideoAndEndorsements = "invitee-pending-video-and-endorsements",
    Donate = "invitee-donate",
    Complete = "invitee-complete",
}

export const INVITEE_INDUCTION_STEPS: Step[] = [
    {
        key: InductionStepInvitee.GetInvite,
        title: "GET INVITED",
        text: "Make sure you have an EOS address.",
    },
    {
        key: InductionStepInvitee.Profile,
        title: "SET UP YOUR PROFILE",
        text: "Let the community know who you are.",
    },
    {
        key: InductionStepInvitee.PendingVideoAndEndorsements,
        title: "GET ENDORSED",
        text: "Complete the induction ceremony.",
    },
    {
        key: InductionStepInvitee.Donate,
        title: "DONATE",
        text: `Give ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        key: InductionStepInvitee.Complete,
        title: "YOU'RE IN",
        text: "NFTs are minted. Welcome to Eden.",
    },
];

export enum InductionStepInviter {
    CreateInvite = "inviter-create-invite",
    PendingProfile = "inviter-pending-profile",
    VideoAndEndorse = "inviter-video-and-endorse",
    PendingDonation = "inviter-pending-donation",
    Complete = "inviter-complete",
}

export const INVITER_INDUCTION_STEPS: Step[] = [
    {
        key: InductionStepInviter.CreateInvite,
        title: "CREATE INVITE",
        text: "Add invitee and witnesses by EOS account.",
    },
    {
        key: InductionStepInviter.PendingProfile,
        title: "INVITEE PROFILE",
        text: "Invitee must log in and set up their profile.",
    },
    {
        key: InductionStepInviter.VideoAndEndorse,
        title: "INDUCT & ENDORSE",
        text:
            "Record and attach induction ceremony. Inviter and witnesses endorse invitee.",
    },
    {
        key: InductionStepInviter.PendingDonation,
        title: "INVITEE DONATION",
        text: `Invitee donates ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        key: InductionStepInviter.Complete,
        title: "ALL DONE",
        text: "NFTs are minted. We have a new member!",
    },
];

export enum InductionStepGenesis {
    Profile = "genesis-profile",
    Donate = "genesis-donate",
    StandBy = "genesis-standby",
    Complete = "genesis-complete",
}

export const GENESIS_INDUCTION_STEPS: Step[] = [
    {
        key: InductionStepGenesis.Profile,
        title: "SET UP YOUR PROFILE",
        text: "Let the community know who you are.",
    },
    {
        key: InductionStepGenesis.Donate,
        title: "DONATE",
        text: `Give ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        key: InductionStepGenesis.StandBy,
        title: "STAND BY",
        text:
            "All Genesis members must complete the process for the community to go live.",
    },
    {
        key: InductionStepGenesis.Complete,
        title: "YOU'RE IN",
        text: "The community is activated. Welcome to Eden.",
    },
];

interface Props {
    step: InductionStep;
    children: React.ReactNode;
}

export const InductionStepsContainer = ({ step, children }: Props) => {
    const isStepIn = <T,>(steps: T) => Object.values(steps).includes(step);

    let steps: Step[] = INVITEE_INDUCTION_STEPS;
    if (isStepIn(InductionStepGenesis)) {
        steps = GENESIS_INDUCTION_STEPS;
    } else if (isStepIn(InductionStepInviter)) {
        steps = INVITER_INDUCTION_STEPS;
    }

    return (
        <Card>
            <div className="flex flex-col lg:flex-row lg:items-center">
                <div className="lg:w-1/2 xl:w-3/5 px-4 sm:px-12 md:px-16 xl:px-24 pt-8 pb-4">
                    {children}
                </div>
                <div className="lg:w-1/2 xl:w-2/5 mt-8 sm:px-8 md:px-12 lg:px-0 self-start">
                    <Steps steps={steps} currentStep={step} />
                </div>
            </div>
        </Card>
    );
};
