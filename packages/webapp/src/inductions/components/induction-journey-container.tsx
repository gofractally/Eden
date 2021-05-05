import React from "react";
import { ActionButton, ActionButtonSize, Card, Steps, Step } from "_app";

const minimumDonation = process.env.NEXT_PUBLIC_APP_MINIMUM_DONATION_AMOUNT;

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
        text: `${minimumDonation} to the Eden community.`,
    },
    {
        title: "YOU'RE IN",
        text: "NFTs are minted. Welcome to Eden.",
    },
];

export const INVITER_INDUCTION_STEPS: Step[] = [
    {
        title: "CREATE INVITE",
        text: "Add invitee and witness by EOS account.",
    },
    {
        title: "INVITEE PROFILE",
        text: "Invitee must log in and set up their profile.",
    },
    {
        title: "INDUCT & ENDORSE",
        text:
            "Record & attach induction ceremony. Inviter & witnesses endorse invitee.",
    },
    {
        title: "INVITEE DONATION",
        text: `Invitee donates ${minimumDonation} to the Eden community.`,
    },
    {
        title: "ALL DONE",
        text: "NFTs are minted. We have new member!",
    },
];

export enum InductionRole {
    INVITEE = "invitee",
    INVITER = "inviter",
}

interface Props {
    role: InductionRole;
    step: 1 | 2 | 3 | 4 | 5;
    children: React.ReactNode;
}

export const InductionJourneyContainer = ({ role, step, children }: Props) => {
    let steps: Step[];

    switch (role) {
        case InductionRole.INVITEE:
            steps = INVITEE_INDUCTION_STEPS;
            break;
        case InductionRole.INVITER:
            steps = INVITER_INDUCTION_STEPS;
            break;
    }

    return (
        <Card>
            <div className="flex lg:items-center flex-col lg:flex-row">
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
