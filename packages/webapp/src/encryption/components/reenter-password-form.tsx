import { PrivateKey } from "eosjs/dist/eosjs-key-conversions";

import { onError, useFormFields } from "_app";
import { Button, Form, Heading, Text } from "_app/ui";

interface Props {
    expectedPublicKey: string;
    isLoading?: boolean;
    onSubmit: (publicKey: string, privateKey: string) => void;
    onCancel: () => void;
    onForgotPassword: () => void;
}

export const ReenterPasswordForm = ({
    expectedPublicKey,
    isLoading,
    onSubmit,
    onCancel,
    onForgotPassword,
}: Props) => {
    const [fields, setFields] = useFormFields({
        password: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const doSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const publicKey = PrivateKey.fromString(
                fields.password
            ).getPublicKey();

            if (publicKey.toLegacyString() !== expectedPublicKey) {
                onError(new Error("The entered password is not correct"));
                return;
            }
            onSubmit(publicKey.toLegacyString(), fields.password);
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    return (
        <div className="space-y-4">
            <Heading>Provide your election password</Heading>
            <Text>
                Enter your election password so that this browser can decrypt
                your video meeting links in the upcoming election.
            </Text>
            <form onSubmit={doSubmit} className="space-y-3">
                <Form.LabeledSet
                    label="Your Election Password"
                    htmlFor="password"
                    className="col-span-6 sm:col-span-3"
                >
                    <Form.Input
                        id="password"
                        type="text"
                        required
                        value={fields.password}
                        disabled={isLoading}
                        onChange={onChangeFields}
                    />
                    <Button
                        type="link"
                        onClick={onForgotPassword}
                        className="pl-0 pr-0"
                    >
                        I forgot my password
                    </Button>
                </Form.LabeledSet>
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        isSubmit
                        disabled={!fields.password || isLoading}
                        isLoading={isLoading}
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    );
};
