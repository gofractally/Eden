import React, { FormEvent, useState } from "react";

import { EdenNftSocialHandles } from "nfts";
import {
    useFormFields,
    Form,
    Heading,
    ActionButton,
    HelpLink,
    handleFileChange,
    Text,
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

    const [uploadedImage, setUploadedImage] = useState<File | undefined>(
        undefined
    );

    const [fields, setFields] = useFormFields({ ...newMemberProfile });

    const [socialFields, setSocialFields] = useFormFields(
        convertNewMemberProfileSocial(newMemberProfile.social)
    );

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const onChangeSocialFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setSocialFields(e);

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

            <Form.LabeledSet label="" htmlFor="imgFile" className="col-span-6">
                <div className="flex items-center mb-1 space-x-1">
                    <p className="text-sm font-medium text-gray-700">
                        Profile image
                    </p>
                    <HelpLink href="https://www.notion.so/edenos/Upload-Profile-Photo-c15a7a050d3c411faca21a3cd3d2f0a3" />
                </div>
                <Form.FileInput
                    id="imgFile"
                    accept="image/*"
                    label="select an image file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFileChange(e, "image", setUploadedImage)
                    }
                />
                {uploadedImage || fields.img ? (
                    <img
                        src={
                            uploadedImage
                                ? URL.createObjectURL(uploadedImage)
                                : `https://ipfs.io/ipfs/${fields.img}`
                        }
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
                    placeholder="YourUsername"
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
                    placeholder="YourHandle"
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
                    placeholder="YourHandle"
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
                    placeholder="yoursite.com"
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
                    placeholder="YourHandle"
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
                    placeholder="YourUsername"
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

            <div className="col-span-6">
                <Text>
                    <span className="italic font-medium">Don't worry!</span>{" "}
                    Even though you are committing your information to the
                    blockchain right now, you will be able to review your
                    profile and make changes to it all the way up until you
                    complete your donation.
                </Text>
            </div>

            {onSubmit && (
                <div className="col-span-6 pt-4">
                    <ActionButton
                        isSubmit
                        isLoading={isLoading}
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
