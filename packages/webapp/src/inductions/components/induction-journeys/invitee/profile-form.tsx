import { FormEvent, useState } from "react";
import { useForm } from "react-hook-form";

import {
    useFormFields,
    Form,
    Heading,
    Button,
    HelpLink,
    handleFileChange,
    Text,
    isValidFacebookHandle,
    isValidTwitterHandle,
    isValidTelegramHandle,
    isValidLinkedinHandle,
} from "_app";
import { edenContractAccount, validUploadActions } from "config";
import { EdenNftSocialHandles } from "nfts";
import { NewMemberProfile } from "inductions";

interface Props {
    newMemberProfile: NewMemberProfile;
    onSubmit?: (
        newMemberProfile: NewMemberProfile,
        selectedProfilePhoto?: File
    ) => void;
    selectedProfilePhoto?: File;
}

type FormValues = {
    name: string;
    imgFile: any;
    attributions: string;
    bio: string;
    eosCommunity: string;
    twitter: string;
    telegram: string;
    blog: string;
    linkedin: string;
    facebook: string;
};

export const InductionProfileForm = ({
    newMemberProfile,
    onSubmit,
    selectedProfilePhoto,
}: Props) => {
    const [selectedImage, setSelectedImage] = useState<File | undefined>(
        selectedProfilePhoto
    );

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormValues>();

    // const [fields, setFields] = useFormFields({ ...newMemberProfile });
    // const [socialFields, setSocialFields] = useFormFields(
    //     convertNewMemberProfileSocial(newMemberProfile.social)
    // );
    // const [isFormFieldValid, setIsFormFieldValid] = useState({
    //     twitter: true,
    //     telegram: true,
    //     linkedin: true,
    //     facebook: true,
    // });
    // const [formErrors, setFormErrors] = useState({});

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    // setIsFormFieldValid({
    //     twitter: isValidTwitterHandle(socialFields.twitter),
    //     telegram: isValidTelegramHandle(socialFields.telegram),
    //     linkedin: isValidLinkedinHandle(socialFields.linkedin),
    //     facebook: isValidFacebookHandle(socialFields.facebook),
    // });

    // const onChangeSocialFields = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setSocialFields(e);
    // };

    const prepareData = (e: FormEvent) => {
        e.preventDefault();
        if (!onSubmit) return;

        // const socialHandles = { ...socialFields };
        // Object.keys(socialHandles).forEach((keyString) => {
        //     const key = keyString as keyof EdenNftSocialHandles;
        //     if (!socialHandles[key]) delete socialHandles[key];
        // });

        console.info("would call onSubmit()");
        // onSubmit(
        //     { ...fields, social: JSON.stringify(socialHandles) },
        //     selectedImage
        // );
    };

    console.info(errors);
    return (
        <form
            onSubmit={handleSubmit(prepareData)}
            className="grid grid-cols-6 gap-4"
        >
            <Form.LabeledSet
                label="Your name"
                htmlFor="name"
                className="col-span-6"
            >
                <Form.Input
                    id="name"
                    {...register("name", { required: "Name is required" })}
                />
                {errors.name && (
                    <Text className="text-red-600">{errors.name.message}</Text>
                )}
            </Form.LabeledSet>

            {/* <Form.LabeledSet label="" htmlFor="imgFile" className="col-span-6">
                <div className="flex items-center mb-1 space-x-1">
                    <p className="text-sm font-medium text-gray-700">
                        Profile image
                    </p>
                    <HelpLink href="https://www.notion.so/edenos/Upload-Profile-Photo-c15a7a050d3c411faca21a3cd3d2f0a3" />
                </div>
                <Form.FileInput
                    id="imgFile"
                    accept="image/*"
                    label={
                        selectedImage || fields.img
                            ? "select a different image"
                            : "select an image file"
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFileChange(
                            e,
                            "image",
                            validUploadActions[edenContractAccount][
                                "inductprofil"
                            ].maxSize,
                            setSelectedImage
                        )
                    }
                />
                {selectedImage || fields.img ? (
                    <img
                        src={
                            selectedImage
                                ? URL.createObjectURL(selectedImage)
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
            </Form.LabeledSet> */}

            <Form.LabeledSet
                label="Credit for profile image goes to (optional)"
                htmlFor="attributions"
                className="col-span-6"
            >
                <Form.Input id="attributions" {...register("attributions")} />
            </Form.LabeledSet>

            <Form.LabeledSet
                label="Biography"
                htmlFor="bio"
                className="col-span-6"
            >
                <Form.TextArea
                    id="bio"
                    {...register("bio", { required: "Bio is required" })}
                />
                {errors.bio && (
                    <Text className="text-red-600">{errors.bio.message}</Text>
                )}
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
                    {...register("eosCommunity")}
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
                    {...register("twitter")}
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
                    {...register("telegram", {
                        required: "Telegram name is required",
                    })}
                    placeholder="YourHandle"
                />
                {errors.telegram && (
                    <Text className="text-red-600">
                        {errors.telegram.message}{" "}
                    </Text>
                )}
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Personal website"
                htmlFor="blog"
                className="col-span-6 md:col-span-3 lg:col-span-6 xl:col-span-3"
            >
                <Form.Input
                    id="blog"
                    {...register("blog")}
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
                    {...register("linkedin")}
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
                    {...register("facebook")}
                    placeholder="YourUsername"
                />
            </Form.LabeledSet>

            {onSubmit && (
                <div className="col-span-6 pt-4">
                    <Button isSubmit>Preview My Profile</Button>
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
