import { Dispatch, SetStateAction } from "react";

import {
    Heading,
    onError,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useUALAccount,
} from "_app";
import {
    InductionExpiresIn,
    InductionProfileForm,
    setInductionProfileTransaction,
} from "inductions";
import { Induction, NewMemberProfile } from "inductions/interfaces";

interface Props {
    induction: Induction;
    isReviewingProfile: boolean;
    setSubmittedProfile: Dispatch<SetStateAction<boolean>>;
}

export const InductionProfileFormContainer = ({
    induction,
    isReviewingProfile,
    setSubmittedProfile,
}: Props) => {
    const [ualAccount] = useUALAccount();

    const submitInductionProfileTransaction = async (
        newMemberProfile: NewMemberProfile,
        uploadedImage?: File
    ) => {
        try {
            const img = uploadedImage
                ? await uploadToIpfs(uploadedImage)
                : newMemberProfile.img;

            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionProfileTransaction(
                authorizerAccount,
                induction.id,
                { ...newMemberProfile, img }
            );
            console.info(transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: !uploadedImage,
            });
            console.info("inductprofil trx", signedTrx);

            if (uploadedImage) {
                await uploadIpfsFileWithTransaction(signedTrx, img);
            }

            setSubmittedProfile(true);
        } catch (error) {
            onError(error, "Unable to set the profile");
        }
    };

    return (
        <>
            <Heading size={1} className="mb-2">
                {isReviewingProfile
                    ? "Review your Eden profile"
                    : "Create your Eden profile"}
            </Heading>
            <InductionExpiresIn induction={induction} />
            <InductionProfileForm
                newMemberProfile={induction.new_member_profile}
                onSubmit={submitInductionProfileTransaction}
            />
        </>
    );
};
