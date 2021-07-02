import { Dispatch, FormEvent, SetStateAction, useMemo, useState } from "react";

import {
    Button,
    Card,
    Form,
    onError,
    Text,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useUALAccount,
} from "_app";
import {
    convertPendingProfileToMemberData,
    MemberCardPreview,
    setInductionProfileTransaction,
} from "inductions";
import { Induction, NewMemberProfile } from "inductions/interfaces";

interface Props {
    induction: Induction;
    setDidSubmitProfile: Dispatch<SetStateAction<boolean>>;
    pendingProfile: {
        profileInfo?: NewMemberProfile;
        selectedPhoto?: File;
    };
    editProfile: () => void;
}

export const InductionProfilePreview = ({
    induction,
    setDidSubmitProfile,
    pendingProfile,
    editProfile,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [ualAccount] = useUALAccount();
    const { profileInfo, selectedPhoto } = pendingProfile;

    const submitInductionProfileTransaction = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (!profileInfo) throw new Error("Profile data is missing.");
            const img = selectedPhoto
                ? await uploadToIpfs(selectedPhoto)
                : profileInfo.img;

            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionProfileTransaction(
                authorizerAccount,
                induction.id,
                { ...profileInfo, img }
            );
            console.info(transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: !selectedPhoto,
            });
            console.info("inductprofil trx", signedTrx);

            if (selectedPhoto) {
                await uploadIpfsFileWithTransaction(signedTrx, img);
            }

            setDidSubmitProfile(true);
        } catch (error) {
            onError(error, "Unable to set the profile");
        }
        setIsLoading(false);
    };

    const memberCardData = useMemo(() => {
        let pendingProfile = profileInfo;
        if (selectedPhoto) {
            const img = URL.createObjectURL(selectedPhoto);
            pendingProfile = { ...profileInfo!, img };
        }
        return convertPendingProfileToMemberData(
            pendingProfile!,
            induction.invitee
        );
    }, [induction.invitee, profileInfo, selectedPhoto]);

    return (
        <>
            <MemberCardPreview cardTitle="" memberData={memberCardData} />
            <Card title="Review your profile">
                <form
                    onSubmit={submitInductionProfileTransaction}
                    className="grid grid-cols-6 gap-4"
                >
                    <div className="col-span-6">
                        <Text>
                            Review your profile above as per the check boxes
                            below. This is your first Eden community NFT and
                            will be used by your fellow members to get to know
                            you so please do your best to get it right.
                        </Text>
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="image"
                            label="My face is clearly visible and is large enough that I can be easily identified as me. I'm not wearing a mask or sunglasses."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="statement"
                            label="My profile statement is accurate and complete to the best of my knowledge."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="links"
                            label="I have clicked/tapped on each social link above and affirm that all links are working properly."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="handles"
                            label="All social handles I have provided belong to me."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="col-span-6 p-3 border rounded">
                        <Form.Checkbox
                            id="consent"
                            label="I understand and acknowledge that by submitting my profile I am publishing my information permanently and irrevocably to an immutable, public blockchain."
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="flex col-span-6 pt-4 space-x-4 justify-center sm:justify-start">
                        <Button onClick={editProfile} type="neutral">
                            Make Changes
                        </Button>
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit Profile"}
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
};

export default InductionProfilePreview;
