import { useState } from "react";

import { Heading, Link, Text, useUALAccount } from "_app";
import { Induction, MemberData, NewMemberProfile } from "../interfaces";
import { setInductionProfileTransaction, hiTransaction } from "../transactions";
import { InductionProfileForm } from "./induction-profile-form";
import { MemberCard } from "./member-card";
import { NewMemberCardPreview } from "./new-member-card-preview";

interface Props {
    induction: Induction;
}

export const InductionStepVideo = ({ induction }: Props) => {
    const [ualAccount] = useUALAccount();

    const [submittedProfile, setSubmittedProfile] = useState(false);

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
            console.error(error);
            alert(
                "Error while initializing the induction process: " +
                    JSON.stringify(error)
            );
        }
    };

    const memberData = convertPendingProfileToMemberData(
        induction.invitee,
        induction.new_member_profile
    );

    return (
        <>
            {submittedProfile ? (
                <div>
                    <Text className="mb-4">
                        Thanks for submitting your profile!
                    </Text>
                    <Link onClick={() => window.location.reload()}>
                        Click here to refresh the page and view your induction
                        process status.
                    </Link>
                </div>
            ) : (
                <>
                    <div className="text-lg mb-4 text-gray-900">
                        Step 2/3: Waiting for Induction Video Upload
                    </div>
                    <div className="grid grid-cols-2 gap-6 max-w-full">
                        <div>
                            <Heading size={3} className="mb-4">
                                Induction Process Details
                            </Heading>
                            {ualAccount?.accountName === induction.inviter ||
                            induction.witnesses.indexOf(
                                ualAccount?.accountName
                            ) >= 0 ? (
                                "Video Form"
                            ) : (
                                // <InductionVideoForm
                                //     newMemberProfile={
                                //         induction.new_member_profile
                                //     }
                                //     onSubmit={
                                //         submitInductionProfileTransaction
                                //     }
                                // />
                                <div>
                                    Waiting for induction ceremony video upload
                                    from one of the endorsers (inviter or
                                    witnesses).
                                </div>
                            )}
                        </div>
                        <div>
                            <Heading size={3}>New Member Card Preview</Heading>
                            <NewMemberCardPreview member={memberData} />
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

const convertPendingProfileToMemberData = (
    newMemberAccount: string,
    newMemberProfile: NewMemberProfile
): MemberData => {
    return {
        templateId: 0,
        name: newMemberProfile.name,
        image: newMemberProfile.img,
        edenAccount: newMemberAccount,
        bio: newMemberProfile.bio,
        socialHandles: JSON.parse(newMemberProfile.social || "{}"),
        inductionVideo: "",
        createdAt: 0,
    };
};
