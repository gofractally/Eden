import { Dispatch, FormEvent, SetStateAction, useState } from "react";
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
    newMemberProfile: NewMemberProfile;
    selectedProfilePhoto?: File;
    showProfileForm: () => void;
}

export const InductionProfilePreview = ({
    induction,
    setDidSubmitProfile,
    newMemberProfile,
    selectedProfilePhoto,
    showProfileForm,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [consentsToPublish, setConsentsToPublish] = useState(false);
    const [ualAccount] = useUALAccount();

    const submitInductionProfileTransaction = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const img = selectedProfilePhoto
                ? await uploadToIpfs(selectedProfilePhoto)
                : newMemberProfile.img;

            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionProfileTransaction(
                authorizerAccount,
                induction.id,
                { ...newMemberProfile, img }
            );
            console.info(transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: !selectedProfilePhoto,
            });
            console.info("inductprofil trx", signedTrx);

            if (selectedProfilePhoto) {
                await uploadIpfsFileWithTransaction(signedTrx, img);
            }

            setDidSubmitProfile(true);
        } catch (error) {
            onError(error, "Unable to set the profile");
        }
        setIsLoading(false);
    };

    const prepareMemberCard = () => {
        // TODO: memoize
        let pendingProfile = newMemberProfile;
        if (selectedProfilePhoto) {
            const img = URL.createObjectURL(selectedProfilePhoto);
            console.log(img);
            pendingProfile = { ...newMemberProfile, img };
        }
        return convertPendingProfileToMemberData(
            pendingProfile,
            induction.invitee
        );
    };

    return (
        <>
            <MemberCardPreview memberData={prepareMemberCard()} />
            <Card>
                <form
                    onSubmit={submitInductionProfileTransaction}
                    className="grid grid-cols-6 gap-4"
                >
                    <div className="col-span-6 p-3 border rounded-md">
                        <Form.Checkbox
                            id="reviewed"
                            label="I understand and acknowledge that I am publishing the profile information above permanently and irrevocably to an immutable, public blockchain. When I submit this form, it cannot be undone."
                            value={Number(consentsToPublish)}
                            onChange={() =>
                                setConsentsToPublish(!consentsToPublish)
                            }
                        />
                    </div>
                    <div className="col-span-6">
                        <Text>
                            <span className="italic font-medium">
                                Don't worry!
                            </span>{" "}
                            Even though you are committing your information to
                            the blockchain right now, you will be able to review
                            your profile and make changes to it all the way up
                            until you complete your donation.
                        </Text>
                    </div>
                    <div className="col-span-6 pt-4">
                        <Button onClick={showProfileForm}>Make Changes</Button>
                    </div>
                    <div className="col-span-6 pt-4">
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={isLoading || !consentsToPublish}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
};

export default InductionProfilePreview;
