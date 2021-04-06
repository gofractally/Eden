import { FormEvent } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import { Button, Link, SmallText, Form, useFormFields, Heading } from "_app";

import { edenNftCreationTransaction } from "../transactions";

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
    telegram: "",
    facebook: "",
    blog: "",
};

const SubmissionForm = ({ ual }: WithUALProps) => {
    const [fields, setFields] = useFormFields({ ...initialForm });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();

        const inductors = fields.inductors.split(",");

        const assetsToMint = inductors.length + 2;

        if (inductors.length < 1) {
            alert("At least one inductor is required");
            return;
        }

        if (
            !confirm(
                `By signing the following transaction, we are going to mint ${assetsToMint} NFTs. #1 goes to the eden community contract account, #2 goes to the new member ${fields.edenAccount}, #3 goes to inviter account ${inductors[0]} and the rest goes to the remaining inductors. Do you agree?`
            )
        ) {
            return;
        }

        try {
            const transaction = edenNftCreationTransaction(
                ual.activeUser.accountName,
                fields.inductors.split(","),
                fields.name,
                fields.image,
                fields.edenAccount,
                fields.bio,
                fields.inductionVideo
            );
            const signedTrx = await ual.activeUser.signTransaction(
                transaction,
                {
                    broadcast: true,
                }
            );
            console.info(signedTrx);
            // TODO: parse signedTrx.transaction.processed.action_traces[0].inline_traces[0].act
            // do we get that in EOS MainNet?
            // act.account = "atomicassets"
            // act.name = "lognewtempl"
            // act.data => read abi => act.data.template_id: 71543
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
                                        className="mcol-span-6 sm:col-span-3"
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
                                            required
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
                                            required
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
                                            required
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
                                            required
                                            value={fields.blog}
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
                                            required
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
