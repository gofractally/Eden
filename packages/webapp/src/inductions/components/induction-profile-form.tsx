import React, { FormEvent, useState } from "react";

import { EdenNftSocialHandles } from "nfts";
import { useFormFields, Form, Heading, ActionButton } from "_app";
import { NewMemberProfile } from "../interfaces";

interface Props {
    newMemberProfile: NewMemberProfile;
    disabled?: boolean;
    onSubmit?: (newMemberProfile: NewMemberProfile) => Promise<void>;
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
        await onSubmit({ ...fields, social: JSON.stringify(socialHandles) });
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

            <Form.LabeledSet
                label="Profile image (IPFS hash)"
                htmlFor="img"
                className="col-span-6"
            >
                <Form.Input
                    id="img"
                    type="text"
                    required
                    disabled={isLoading || disabled}
                    value={fields.img}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>

            <Form.LabeledSet
                label="Profile image attribution (optional)"
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
                label="EOSCommunity username"
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

            {onSubmit && (
                <div className="pt-4">
                    <ActionButton isSubmit disabled={isLoading}>
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
