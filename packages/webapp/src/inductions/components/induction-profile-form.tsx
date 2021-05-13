import React, { FormEvent, useMemo, useState } from "react";

import { EdenNftSocialHandles } from "nfts";
import {
    useFormFields,
    Form,
    Heading,
    ActionButton,
    Link,
    validateCID,
} from "_app";
import { NewMemberProfile } from "../interfaces";

interface Props {
    newMemberProfile: NewMemberProfile;
    disabled?: boolean;
    onSubmit?: (
        newMemberProfile: NewMemberProfile,
        uploadedImage?: File
    ) => Promise<void>;
}

export interface InitInductionFormData {
    invitee: string;
    witness1: string;
    witness2: string;
}

export const InductionProfileForm = ({
    newMemberProfile,
    disabled,
    onSubmit,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [consentsToPublish, setConsentsToPublish] = useState(false);

    const [fields, setFields] = useFormFields({ ...newMemberProfile });

    const [socialFields, setSocialFields] = useFormFields(
        convertNewMemberProfileSocial(newMemberProfile.social)
    );

    const isPhotoValidCID = useMemo(() => validateCID(fields.img), [
        fields.img,
    ]);

    const [uploadedImage, setUploadedImage] = useState<File | undefined>(
        undefined
    );

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const onChangeSocialFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setSocialFields(e);

    const handleProfileImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        e.preventDefault();

        if (!e.target.files || !e.target.files.length) {
            return;
        }

        var file = e.target.files[0];

        // Clear the selection in the file picker input.
        // todo: reset input? (it does not work if the user wants to switch the file)

        // Check if the file is an image.
        if (!file.type.match("image.*")) {
            return alert("You can only select images");
        }

        setUploadedImage(file);
    };

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();
        if (!onSubmit) return;

        const socialHandles = { ...socialFields };
        Object.keys(socialHandles).forEach((keyString) => {
            const key = keyString as keyof EdenNftSocialHandles;
            if (!socialHandles[key]) delete socialHandles[key];
        });

        setIsLoading(true);
        await onSubmit(
            { ...fields, social: JSON.stringify(socialHandles) },
            uploadedImage
        );
        setIsLoading(false);
    };

    return (
        <form onSubmit={submitTransaction} className="grid grid-cols-6 gap-4">
            <Form.LabeledSet
                label="Your name"
                htmlFor="name"
                className="col-span-6"
            >
                <Form.Input
                    id="name"
                    type="text"
                    required
                    disabled={isLoading || disabled}
                    value={fields.name}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>

            <Form.LabeledSet label="" htmlFor="img" className="col-span-6">
                <div className="flex items-center mb-1 space-x-1">
                    <p className="text-sm font-medium text-gray-700">
                        Profile image (IPFS CID)
                    </p>
                    <Link
                        isExternal
                        href="https://www.notion.so/edenos/Upload-Profile-Photo-c15a7a050d3c411faca21a3cd3d2f0a3"
                        target="_blank"
                        className="hover:no-underline"
                    >
                        <div className="flex justify-center items-center h-5 w-5 rounded-full bg-gray-300 hover:bg-gray-200 border border-gray-400">
                            <span className="text-gray-800 hover:text-gray-700 font-semibold text-sm">
                                ?
                            </span>
                        </div>
                    </Link>
                </div>
                {/* <Form.Input
                    id="img"
                    type="text"
                    required
                    disabled={isLoading || disabled}
                    value={fields.img}
                    onChange={onChangeFields}
                /> */}
                <Form.FileInput
                    id="imgFile"
                    accept="image/*"
                    label="select an image file"
                    onChange={handleProfileImageUpload}
                />

                {fields.img && !isPhotoValidCID && (
                    <p className={"text-red-500 text-sm mt-1"}>
                        This is not a valid IPFS CID.
                    </p>
                )}
                {isPhotoValidCID ? (
                    <img
                        src={`https://ipfs.io/ipfs/${fields.img}`}
                        alt="profile pic"
                        className="object-cover rounded-full h-24 w-24 mt-4 mx-auto"
                    />
                ) : (
                    <img
                        src="/images/blank-profile-picture.svg"
                        alt="blank profile pic"
                        className="rounded-full h-24 w-24 my-2 mx-auto"
                    />
                )}
            </Form.LabeledSet>

            <Form.LabeledSet
                label="Credit for profile image goes to (optional)"
                htmlFor="attributions"
                className="col-span-6"
            >
                <Form.Input
                    id="attributions"
                    type="text"
                    disabled={isLoading || disabled}
                    value={fields.attributions}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>

            <Form.LabeledSet
                label="Biography"
                htmlFor="bio"
                className="col-span-6"
            >
                <Form.TextArea
                    id="bio"
                    required
                    disabled={isLoading || disabled}
                    value={fields.bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFields(e)
                    }
                />
            </Form.LabeledSet>

            <Heading size={3} className="col-span-6">
                Social handles and links
            </Heading>
            <Form.LabeledSet
                label="EOSCommunity.org username"
                htmlFor="eosCommunity"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="eosCommunity"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.eosCommunity}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Twitter handle"
                htmlFor="twitter"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="twitter"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.twitter}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Telegram handle"
                htmlFor="telegram"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="telegram"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.telegram}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Personal blog URL"
                htmlFor="blog"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="blog"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.blog}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="LinkedIn handle"
                htmlFor="linkedin"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="linkedin"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.linkedin}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Facebook username"
                htmlFor="facebook"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="facebook"
                    type="text"
                    disabled={isLoading || disabled}
                    value={socialFields.facebook}
                    onChange={onChangeSocialFields}
                />
            </Form.LabeledSet>

            <div className="col-span-6 p-3 border rounded-md">
                <Form.Checkbox
                    id="reviewed"
                    label="I understand and acknowledge that I am publishing the profile information above permanently and irrevocably to an immutable, public blockchain. When I submit this form, it cannot be undone."
                    value={Number(consentsToPublish)}
                    onChange={() => setConsentsToPublish(!consentsToPublish)}
                />
            </div>

            {onSubmit && (
                <div className="pt-4">
                    <ActionButton
                        isSubmit
                        disabled={isLoading || !consentsToPublish}
                    >
                        {isLoading ? "Submitting..." : "Submit"}
                    </ActionButton>
                </div>
            )}
        </form>
    );
};

const convertNewMemberProfileSocial = (
    social: string
): EdenNftSocialHandles => {
    const socialHandles = JSON.parse(social || "{}");
    return {
        eosCommunity: socialHandles.eosCommunity || "",
        twitter: socialHandles.twitter || "",
        linkedin: socialHandles.linkedin || "",
        telegram: socialHandles.telegram || "",
        facebook: socialHandles.facebook || "",
        blog: socialHandles.blog || "",
    };
};
