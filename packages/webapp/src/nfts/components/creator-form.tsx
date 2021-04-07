import { FormEvent } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { Button, Link, SmallText, Form, useFormFields, Heading } from "_app";

import {
    EdenNftCreationData,
    EdenNftData,
    EdenNftSocialHandles,
} from "../interfaces";
import { createNft } from "../handlers";

interface WithUALProps {
    ual: any;
}

export const CreatorForm = ({ ual }: WithUALProps) => {
    return ual.activeUser ? (
        <SubmissionForm ual={ual} />
    ) : (
        <Button onClick={ual.showModal}>Login</Button>
    );
};

const initialForm = {
    name: "",
    edenAccount: "",
    image: "",
    bio: "",
    inductionVideo: "",
    inductors: "",
    eosCommunity: "",
    twitter: "",
    linkedin: "",
    telegram: "",
    facebook: "",
    blog: "",
};

const SubmissionForm = ({ ual }: WithUALProps) => {
    const [fields, setFields] = useFormFields({ ...initialForm });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const fieldsToCreationNftData = (): EdenNftCreationData => {
        const socialHandles: EdenNftSocialHandles = {
            eosCommunity: fields.eosCommunity,
            twitter: fields.twitter,
            linkedin: fields.linkedin,
            telegram: fields.telegram,
            facebook: fields.facebook,
            blog: fields.blog,
        };
        Object.keys(socialHandles).forEach((keyString) => {
            const key = keyString as keyof EdenNftSocialHandles;
            if (!socialHandles[key]) delete socialHandles[key];
        });

        const nft: EdenNftData = {
            name: fields.name,
            edenacc: fields.edenAccount,
            img: fields.image,
            bio: fields.bio,
            inductionvid: fields.inductionVideo,
            social: JSON.stringify(socialHandles),
        };

        return {
            nft,
            inductors: fields.inductors.split(","),
        };
    };

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();

        try {
            const creationData = fieldsToCreationNftData();
            await createNft(ual, creationData);
        } catch (error) {
            console.error(error);
            alert("An error has occurred. \n" + JSON.stringify(error));
        }
    };

    return (
        <>
            <div className="p-8 md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                    <div className="px-4 sm:px-0">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                            New Eden Member NFT Creation
                        </h3>
                        <p className="mt-3 text-sm text-gray-600">
                            Please provide the following information to create a
                            new Atomic Asset NFT for an Eden Member and mint all
                            the assets to community and relevant members
                            (inviter, invitee and endorsers)
                        </p>
                        <p className="mt-3 text-sm text-gray-600">
                            *{" "}
                            <strong>
                                The order of the members who invited and
                                endorsed this new member matters! NFTs will be
                                issued in the order of the Inductors field.
                            </strong>{" "}
                            Inviter should always be the first, followed by the
                            endorsers. These accounts should be separated by
                            commas.
                        </p>
                    </div>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                    <form onSubmit={submitTransaction}>
                        <div className="shadow sm:rounded-md sm:overflow-hidden">
                            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                                <div className="grid grid-cols-6 gap-6">
                                    <Form.LabeledSet
                                        label="Name"
                                        htmlFor="name"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.Input
                                            id="name"
                                            type="text"
                                            required
                                            value={fields.name}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Eden Account (EOS Mainnet Account)"
                                        htmlFor="edenAccount"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.Input
                                            id="edenAccount"
                                            type="text"
                                            required
                                            value={fields.edenAccount}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Image IPFS Hash"
                                        htmlFor="image"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.Input
                                            id="image"
                                            type="text"
                                            required
                                            placeholder="QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS"
                                            value={fields.image}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Induction Video IPFS Hash"
                                        htmlFor="inductionVideo"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.Input
                                            id="inductionVideo"
                                            type="text"
                                            required
                                            placeholder="QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS"
                                            value={fields.inductionVideo}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Biography"
                                        htmlFor="bio"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.TextArea
                                            id="bio"
                                            required
                                            value={fields.bio}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLTextAreaElement>
                                            ) => setFields(e)}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Inductors *"
                                        htmlFor="inductors"
                                        className="col-span-6 sm:col-span-3"
                                    >
                                        <Form.TextArea
                                            id="inductors"
                                            required
                                            value={fields.inductors}
                                            placeholder="inviter, endorser1, endorser2, endorser3, endorser4, endorser5"
                                            onChange={(
                                                e: React.ChangeEvent<HTMLTextAreaElement>
                                            ) => setFields(e)}
                                        />
                                    </Form.LabeledSet>
                                    <Heading size={3} className="col-span-6">
                                        Social Handles
                                    </Heading>
                                    <Form.LabeledSet
                                        label="EOSCommunity User"
                                        htmlFor="eosCommunity"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="eosCommunity"
                                            type="text"
                                            value={fields.eosCommunity}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Twitter Handle"
                                        htmlFor="twitter"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="twitter"
                                            type="text"
                                            value={fields.twitter}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Telegram Handle"
                                        htmlFor="telegram"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="telegram"
                                            type="text"
                                            value={fields.telegram}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Personal Blog Address"
                                        htmlFor="blog"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="blog"
                                            type="text"
                                            value={fields.blog}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Linkedin Public Handle"
                                        htmlFor="linkedin"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="linkedin"
                                            type="text"
                                            value={fields.linkedin}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                    <Form.LabeledSet
                                        label="Facebook User Handle"
                                        htmlFor="facebook"
                                        className="col-span-6 sm:col-span-2"
                                    >
                                        <Form.Input
                                            id="facebook"
                                            type="text"
                                            value={fields.facebook}
                                            onChange={onChangeFields}
                                        />
                                    </Form.LabeledSet>
                                </div>
                                <div className="mt-4 mx-auto w-max">
                                    <Button isSubmit>Submit</Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <LogoutFooter ual={ual} />
        </>
    );
};

const LogoutFooter = ({ ual }: WithUALProps) => (
    <SmallText className="mt-6 mx-auto w-max">
        Creating NFTs as {ual.activeUser.accountName}{" "}
        <Link onClick={ual.logout}>
            logout <FaSignOutAlt className="inline-block" />
        </Link>
    </SmallText>
);
