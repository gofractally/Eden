import { FormEvent, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
    useFormFields,
    Form,
    Heading,
    Button,
    HelpLink,
    handleFileChange,
    Text,
} from "_app";
import { edenContractAccount, validUploadActions } from "config";
import { EdenNftSocialHandles } from "nfts";
import { NewMemberProfile } from "inductions";
import { getValidSocialLink } from "_app/utils/social-links";
import * as yup from "yup";

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

    const socialFieldsAlreadyEntered = convertNewMemberProfileSocial(
        newMemberProfile.social
    );
    console.info("root.socialFieldsAlreadyEnetered:");
    console.info(socialFieldsAlreadyEntered);

    const schema = yup.object().shape({
        name: yup.string().required(),
        bio: yup.string().required(),
        imgFile: yup
            .mixed()
            .required("Profile pic required")
            .test(
                "fileSize",
                "The file is too large",
                (value) =>
                    value &&
                    value[0].size <=
                        validUploadActions[edenContractAccount]["inductprofil"]
                            .maxSize
            )
            .test("type", "Must be an image", (value) =>
                value.type.match(`image.*`)
            ),
    });

    // console.info("watch():");
    // console.info(watch());
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: newMemberProfile.name,
            attributions: newMemberProfile.attributions,
            bio: newMemberProfile.bio,
            eosCommunity: socialFieldsAlreadyEntered.eosCommunity,
            twitter: socialFieldsAlreadyEntered.twitter,
            telegram: socialFieldsAlreadyEntered.telegram,
            blog: socialFieldsAlreadyEntered.blog,
            linkedin: socialFieldsAlreadyEntered.linkedin,
            facebook: socialFieldsAlreadyEntered.facebook,
        },
    });

    // const [fields, setFields] = useFormFields({ ...newMemberProfile });
    // const [isFormFieldValid, setIsFormFieldValid] = useState({
    //     twitter: true,
    //     telegram: true,
    //     linkedin: true,
    //     facebook: true,
    // });
    // const [formErrors, setFormErrors] = useState({});

    // const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
    //     setFields(e);

    // setIsFormFieldValid({
    //     twitter: isValidTwitterHandle(socialFields.twitter),
    //     telegram: isValidTelegramHandle(socialFields.telegram),
    //     linkedin: isValidLinkedinHandle(socialFields.linkedin),
    //     facebook: isValidFacebookHandle(socialFields.facebook),
    // });

    // const onChangeSocialFields = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setSocialFields(e);
    // };

    const prepareData = (data: any) => {
        console.info("prepareData().top");
        console.info(data);
        if (!onSubmit) return;

        // console.info("prepareData().socialFieldsAlreadyEnetered:");
        // console.info(socialFieldsAlreadyEntered);
        // const socialHandles = { ...socialFieldsAlreadyEntered };
        // console.info('socialHandles:')
        // console.info(socialHandles)
        const socialHandles: EdenNftSocialHandles = {};
        Object.keys(socialFieldsAlreadyEntered).forEach((keyString) => {
            const key = keyString as keyof EdenNftSocialHandles;
            console.info(`prepareData.key[${key}]`);
            if (data[key]) {
                socialHandles[key] = getValidSocialLink(data[key]);
                console.info(`socialHandles[${key}] = [${socialHandles[key]}]`);
            }
            //delete data[key];
        });
        console.info("data.after:");
        console.info(data);

        console.info("would call onSubmit().socialHandles:");
        console.info(socialHandles);
        console.info({ ...data, social: JSON.stringify(socialHandles) });
        onSubmit(
            { ...data, social: JSON.stringify(socialHandles) },
            selectedImage
        );
    };

    console.info(watch());
    console.info("errors:");
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
                <Form.Input id="name" {...register("name")} />
                {errors.name && (
                    <Text className="text-red-600">{errors.name.message}</Text>
                )}
            </Form.LabeledSet>

            <Controller
                name="imgFile"
                control={control}
                defaultValue=""
                render={({ field }) => (
                    <Form.LabeledSet
                        label=""
                        htmlFor="imgFile"
                        className="col-span-6"
                    >
                        <div className="flex items-center mb-1 space-x-1">
                            <p className="text-sm font-medium text-gray-700">
                                Profile image
                            </p>
                            <HelpLink href="https://www.notion.so/edenos/Upload-Profile-Photo-c15a7a050d3c411faca21a3cd3d2f0a3" />
                        </div>
                        <Form.FileInput
                            id="imgFile"
                            {...field}
                            onChange={(e) => {
                                console.info("e.target.files[0]:");
                                console.info(e.target.files[0]);
                                setSelectedImage(e.target.files[0]);
                                // field.onChange(e.target.files[0]);
                            }}
                            label={
                                selectedImage || field.value
                                    ? "select a different image"
                                    : "select an image file"
                            }
                        />
                        {errors.imgFile && (
                            <Text className="text-red-600">
                                {errors.imgFile.message}
                            </Text>
                        )}
                        {selectedImage || field.value ? (
                            <img
                                src={
                                    selectedImage
                                        ? URL.createObjectURL(selectedImage)
                                        : `https://ipfs.io/ipfs/${field.value}`
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
                )}
            />

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
                <Form.TextArea id="bio" {...register("bio")} />
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
