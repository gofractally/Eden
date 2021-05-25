import { FormEvent, useState } from "react";

import { useFormFields, Form, ActionButton } from "_app";

interface Props {
    onSubmit: (data: InitInductionFormData) => Promise<void>;
}

export interface InitInductionFormData {
    invitee: string;
    witness1: string;
    witness2: string;
}

const initialForm: InitInductionFormData = {
    invitee: "",
    witness1: "",
    witness2: "",
};

export const InductionInviteForm = ({ onSubmit }: Props) => {
    const [isLoading, setIsLoading] = useState(false);

    const [fields, setFields] = useFormFields({ ...initialForm });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSubmit(fields);
        setIsLoading(false);
    };

    return (
        <form onSubmit={submitTransaction} className="space-y-3">
            <Form.LabeledSet
                label="Invitee EOS Account"
                htmlFor="invitee"
                className="col-span-6 sm:col-span-3"
            >
                <Form.Input
                    id="invitee"
                    type="text"
                    required
                    disabled={isLoading}
                    value={fields.invitee}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Witness 1 EOS Account"
                htmlFor="witness1"
                className="col-span-6 sm:col-span-3"
            >
                <Form.Input
                    id="witness1"
                    type="text"
                    required
                    disabled={isLoading}
                    value={fields.witness1}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>
            <Form.LabeledSet
                label="Witness 2 EOS Account"
                htmlFor="witness2"
                className="col-span-6 sm:col-span-3"
            >
                <Form.Input
                    id="witness2"
                    type="text"
                    required
                    disabled={isLoading}
                    value={fields.witness2}
                    onChange={onChangeFields}
                />
            </Form.LabeledSet>
            <div className="pt-4">
                <ActionButton isSubmit disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit"}
                </ActionButton>
            </div>
        </form>
    );
};
