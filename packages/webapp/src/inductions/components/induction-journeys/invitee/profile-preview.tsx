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

    const defaultAffirmations = {
        image: false,
        statement: false,
        links: false,
        handles: false,
        consent: false,
    };
    const [affirmations, setAffirmations] = useState<
        typeof defaultAffirmations
    >(defaultAffirmations);
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

    const setAffirmation = (e: FormEvent) => {
        const key = e.currentTarget.id as keyof typeof defaultAffirmations;
        setAffirmations((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

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
                            Review your profile above for accuracy and
                            compliance.
                        </Text>
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="image"
                            label="My face is clearly visible and takes up most of the frame. I am not wearing a mask or sunglasses, and my likeness is otherwise unobstructed."
                            onChange={setAffirmation}
                            checked={affirmations["image"]}
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="statement"
                            label="My profile statement is accurate and complete to the best of my knowledge. I have reviewed it for spelling and grammar mistakes."
                            onChange={setAffirmation}
                            checked={affirmations["statement"]}
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="links"
                            label="I have clicked/tapped on each social link above and affirm that all links are working properly."
                            onChange={setAffirmation}
                            checked={affirmations["links"]}
                        />
                    </div>
                    <div className="col-span-6 lg:col-span-3 p-3 border rounded">
                        <Form.Checkbox
                            id="handles"
                            label="All social handles I have provided belong to me."
                            onChange={setAffirmation}
                            checked={affirmations["handles"]}
                        />
                    </div>
                    <div className="col-span-6 p-3 border rounded-md">
                        <Form.Checkbox
                            id="consent"
                            label="I understand and acknowledge that by submitting my profile, I am publishing my information permanently and irrevocably to an immutable, public blockchain."
                            onChange={setAffirmation}
                            checked={affirmations["consent"]}
                        />
                    </div>
                    <div className="flex col-span-6 pt-4 space-x-4 justify-center sm:justify-start">
                        <Button onClick={editProfile}>Make Changes</Button>
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={
                                isLoading ||
                                Object.values(affirmations).some((val) => !val)
                            }
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
