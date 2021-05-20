import React from "react";
import { assetToString, Card, Steps, Step } from "_app";
import { minimumDonationAmount } from "config";

export const INVITEE_INDUCTION_STEPS: Step[] = [
    {
        title: "GET INVITED",
        text: "Make sure you have an EOS address.",
    },
    {
        title: "SET UP YOUR PROFILE",
        text: "Let the community know who you are.",
    },
    {
        title: "GET ENDORSED",
        text: "Complete the induction ceremony.",
    },
    {
        title: "DONATE",
        text: `Give ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        title: "YOU'RE IN",
        text: "NFTs are minted. Welcome to Eden.",
    },
];

export enum InductionStepInvitee {
    GetInvite = 1,
    Profile,
    PendingVideoAndEndorsements,
    Donate,
    Complete,
}

export const INVITER_INDUCTION_STEPS: Step[] = [
    {
        title: "CREATE INVITE",
        text: "Add invitee and witnesses by EOS account.",
    },
    {
        title: "INVITEE PROFILE",
        text: "Invitee must log in and set up their profile.",
    },
    {
        title: "INDUCT & ENDORSE",
        text:
            "Record and attach induction ceremony. Inviter and witnesses endorse invitee.",
    },
    {
        title: "INVITEE DONATION",
        text: `Invitee donates ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        title: "ALL DONE",
        text: "NFTs are minted. We have a new member!",
    },
];

export enum InductionStepInviter {
    CreateInvite = 1,
    PendingProfile,
    VideoAndEndorse,
    PendingDonation,
    Complete,
}

export const GENESIS_INDUCTION_STEPS: Step[] = [
    {
        title: "SET UP YOUR PROFILE",
        text: "Let the community know who you are.",
    },
    {
        title: "DONATE",
        text: `Give ${assetToString(
            minimumDonationAmount
        )} to the Eden community.`,
    },
    {
        title: "STAND BY",
        text:
            "All Genesis members must complete the process for the community to go live.",
    },
    {
        title: "YOU'RE IN",
        text: "The community is activated. Welcome to Eden.",
    },
];

export enum InductionStepGenesis {
    Profile = 1,
    Donate,
    StandBy,
    Complete,
}

export enum InductionJourney {
    Invitee = "invitee",
    Inviter = "inviter",
    Genesis = "genesis",
}

interface Props {
    journey: InductionJourney;
    step: InductionStepGenesis | InductionStepInviter | InductionStepInvitee;
    vAlign?: "top" | "center";
    children: React.ReactNode;
}

// TODO: Tighter coupling between the steps enums and the steps themselves above. For example, maybe use a key instead of (index + 1).
// TODO: Infer journey from the step type passed in. (no need to pass the journey in separately.)

export const InductionJourneyContainer = ({
    journey,
    step,
    vAlign = "center",
    children,
}: Props) => {
    let steps: Step[];

    switch (journey) {
        case InductionJourney.Genesis:
            steps = GENESIS_INDUCTION_STEPS;
            break;
        case InductionJourney.Invitee:
            steps = INVITEE_INDUCTION_STEPS;
            break;
        case InductionJourney.Inviter:
            steps = INVITER_INDUCTION_STEPS;
            break;
    }

    const vAlignClass = vAlign === "center" ? "lg:items-center" : "";

    return (
        <Card>
            <div className={`flex flex-col lg:flex-row ${vAlignClass}`}>
                <div className="lg:w-1/2 xl:w-3/5 px-4 sm:px-12 md:px-16 xl:px-24 pt-8 pb-4">
                    {children}
                </div>
                <div className="lg:w-1/2 xl:w-2/5 mt-8 sm:px-8 md:px-12 lg:px-0">
                    <Steps steps={steps} currentStep={step} />
                </div>
            </div>
        </Card>
    );
};
