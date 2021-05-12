import React, { useState } from "react";

import {
    ActionButton,
    ActionButtonSize,
    Heading,
    Link,
    onError,
    Text,
    useUALAccount,
} from "_app";
import { Induction, NewMemberProfile } from "../interfaces";
import { setInductionProfileTransaction } from "../transactions";
import { InductionJourneyContainer, InductionRole } from "inductions";
import { InductionProfileForm } from "./induction-profile-form";
import { getInductionRemainingTimeDays } from "inductions/utils";

interface Props {
    induction: Induction;
    isCommunityActive?: boolean;
    isEndorser: boolean;
    isReviewing?: boolean;
}

export const InductionStepProfile = ({
    induction,
    isCommunityActive,
    isEndorser,
    isReviewing,
}: Props) => {
    const [ualAccount] = useUALAccount();

    const [submittedProfile, setSubmittedProfile] = useState(false);

    const isInvitee = ualAccount?.accountName === induction.invitee;
    const isInviter = ualAccount?.accountName === induction.inviter;

    const submitInductionProfileTransaction = async (
        newMemberProfile: NewMemberProfile
    ) => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionProfileTransaction(
                authorizerAccount,
                induction.id,
                newMemberProfile
            );
            console.info(transaction);
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductprofil trx", signedTrx);
            setSubmittedProfile(true);
        } catch (error) {
            onError(error, "Unable to set the profile");
        }
    };

    // Invitee profile submission confirmation
    if (submittedProfile)
        return (
            <ProfileSubmitConfirmation isCommunityActive={isCommunityActive} />
        );

    // Invitee profile create/update form
    if (isInvitee) {
        return (
            <CreateModifyProfile
                induction={induction}
                onSubmit={submitInductionProfileTransaction}
                isCommunityActive={isCommunityActive}
                isReviewing={isReviewing}
            />
        );
    }

    // Not logged in OR inviter/endorsers profile pending screen
    return (
        <WaitingForInviteeProfile
            induction={induction}
            isCommunityActive={isCommunityActive}
            isInviterOrEndorser={isInviter || isEndorser}
        />
    );
};

const ProfileSubmitConfirmation = ({
    isCommunityActive,
}: {
    isCommunityActive?: boolean;
}) => {
    return (
        <InductionJourneyContainer
            role={
                isCommunityActive
                    ? InductionRole.INVITEE
                    : InductionRole.GENESIS
            }
            step={isCommunityActive ? 3 : 2}
        >
            <Heading size={1} className="mb-5">
                Success!
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    Thanks for submitting your profile.
                </Text>
                <Text className="leading-normal">
                    {isCommunityActive
                        ? "Your inviter and witnesses will be in touch to schedule the short video induction ceremony. Now's a good time to reach out to them to let them know you're ready."
                        : "The next step in the induction process is to submit your donation. Once all Genesis members have completed their profiles and donations, the community will be activated."}
                </Text>
            </div>
            <ActionButton
                onClick={() => window.location.reload()}
                size={ActionButtonSize.L}
            >
                {isCommunityActive ? "See induction status" : "Onward!"}
            </ActionButton>
        </InductionJourneyContainer>
    );
};

interface CreateModifyProfileProps {
    induction: Induction;
    onSubmit?: (newMemberProfile: NewMemberProfile) => Promise<void>;
    isCommunityActive?: boolean;
    isReviewing?: boolean;
}

const CreateModifyProfile = ({
    induction,
    onSubmit,
    isCommunityActive,
    isReviewing,
}: CreateModifyProfileProps) => (
    <InductionJourneyContainer
        role={isCommunityActive ? InductionRole.INVITEE : InductionRole.GENESIS}
        step={isCommunityActive ? 2 : 1}
        vAlign="top"
    >
        <Heading size={1} className="mb-2">
            {isReviewing
                ? "Review your Eden profile"
                : "Create your Eden profile"}
        </Heading>
        <Text className="mb-8">
            This invitation expires in{" "}
            {getInductionRemainingTimeDays(induction)}.
        </Text>
        <InductionProfileForm
            newMemberProfile={induction.new_member_profile}
            onSubmit={onSubmit}
        />
    </InductionJourneyContainer>
);

const WaitingForInviteeProfile = ({
    induction,
    isCommunityActive,
    isInviterOrEndorser,
}: {
    induction: Induction;
    isCommunityActive?: boolean;
    isInviterOrEndorser: boolean;
}) => {
    const getInductionJourneyRole = () => {
        if (!isCommunityActive) {
            return InductionRole.GENESIS;
        } else if (isInviterOrEndorser) {
            return InductionRole.INVITER;
        }
        return InductionRole.INVITEE;
    };

    return (
        <InductionJourneyContainer
            role={getInductionJourneyRole()}
            step={!isCommunityActive ? 1 : 2}
        >
            <Heading size={1} className="mb-5">
                Waiting for invitee
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    We're waiting on{" "}
                    <span className="font-semibold">{induction.invitee}</span>{" "}
                    to set up their Eden profile.
                </Text>
                <Text className="leading-normal">
                    Encourage the invitee to sign into the Membership dashboard
                    with their blockchain account to complete their profile. Or
                    you can share this direct link with them:
                </Text>
                <Text className="leading-normal break-all">
                    <Link href={window.location.href}>
                        {window.location.href}
                    </Link>
                </Text>
                <Text className="leading-normal font-medium">
                    This invitation expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </Text>
            </div>
            <ActionButton href="/induction" size={ActionButtonSize.L}>
                Membership dashboard
            </ActionButton>
        </InductionJourneyContainer>
    );
};
