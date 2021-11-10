import React, { HTMLProps } from "react";

import { tokenConfig } from "config";
import { Button } from "_app";

export const Label: React.FC<{
    htmlFor: string;
}> = (props) => (
    <label className="block text-sm font-normal text-gray-600" {...props}>
        {props.children}
    </label>
);

export const Input: React.FC<
    HTMLProps<HTMLInputElement> & {
        inputRef?: React.Ref<HTMLInputElement> | null;
    }
> = ({ inputRef, ...props }) => (
    <input
        name={props.id}
        className={`w-full bg-white border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${
            props.disabled ? "bg-gray-50" : ""
        }`}
        ref={inputRef}
        {...props}
    />
);

export const FileInput: React.FC<
    HTMLProps<HTMLInputElement> & {
        label?: string;
    }
> = (props) => (
    <label
        htmlFor={props.id}
        className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-400"
    >
        <span>{props.label || "Attach File..."}</span>
        <input type="file" className="sr-only" {...props} />
    </label>
);

export const Select: React.FC<HTMLProps<HTMLSelectElement>> = (props) => (
    <select
        className={`mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-yellow-500 sm:text-sm ${
            props.disabled ? "bg-gray-50" : ""
        }`}
        {...props}
    >
        {props.children}
    </select>
);

export const TextArea: React.FC<HTMLProps<HTMLTextAreaElement>> = (props) => (
    <textarea
        rows={3}
        name={props.id}
        className={`w-full bg-white border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out ${
            props.disabled ? "bg-gray-50" : ""
        }`}
        {...props}
    ></textarea>
);

export const Checkbox: React.FC<
    HTMLProps<HTMLInputElement> & { label: string; description?: string }
> = (props) => (
    <div className="flex items-start">
        <div className="flex items-center h-5">
            <input
                type="checkbox"
                className="focus:ring-yellow-500 h-4 w-4 text-yellow-500 border-gray-300 rounded"
                {...props}
            />
        </div>
        <div className="ml-3 text-sm">
            <label htmlFor={props.id} className="font-medium text-gray-700">
                {props.label}
            </label>
            {props.description && (
                <p className="text-gray-500">{props.description}</p>
            )}
        </div>
    </div>
);

export const LabeledSet: React.FC<{
    htmlFor: string;
    label: string;
    description?: string;
    className?: string;
}> = ({
    htmlFor,
    label,
    children,
    description = undefined,
    className = undefined,
}) => {
    return (
        <div className={className}>
            <Label htmlFor={htmlFor}>{label}</Label>
            <div className="mt-1">{children}</div>
            {description && (
                <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
        </div>
    );
};

export const ChainAccountInput = (
    props: HTMLProps<HTMLInputElement> & { id: string }
) => {
    const validateAccountField = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.validity.valueMissing) {
            target.setCustomValidity("Enter an account name");
        } else {
            target.setCustomValidity("Invalid account name");
        }
    };

    const clearErrorMessages = (e: React.FormEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).setCustomValidity("");
    };

    const onInput = (e: React.FormEvent<HTMLInputElement>) => {
        clearErrorMessages(e);
        props.onInput?.(e);
    };

    const onInvalid = (e: React.FormEvent<HTMLInputElement>) => {
        validateAccountField(e);
        props.onInvalid?.(e);
    };

    return (
        <Form.LabeledSet
            label={`${tokenConfig.symbol} account name (12 characters)`}
            htmlFor={props.id}
        >
            <Form.Input
                type="text"
                maxLength={12}
                pattern="^[a-z,1-5.]{1,12}$"
                {...props}
                onInvalid={onInvalid}
                onInput={onInput}
            />
        </Form.LabeledSet>
    );
};

export const AssetInput = (
    props: HTMLProps<HTMLInputElement> & {
        label: string; // required
        id: string; // required
        inputRef?: React.RefObject<HTMLInputElement>;
    }
) => {
    const { label, inputRef, ...inputProps } = props;

    const amountRef = inputRef ?? React.useRef<HTMLInputElement>(null);

    const amountInputPreventChangeOnScroll = (
        e: React.WheelEvent<HTMLInputElement>
    ) => (e.target as HTMLInputElement).blur();

    const validateAmountField = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.validity.rangeOverflow) {
            target.setCustomValidity("Insufficient funds available");
        } else {
            target.setCustomValidity("Enter a valid amount");
        }
    };

    const clearErrorMessages = (e: React.FormEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).setCustomValidity("");
    };

    const setMaxAmount = () => {
        amountRef.current?.setCustomValidity("");

        // ensures this works with uncontrolled instances of this input too
        Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
        )?.set?.call?.(amountRef.current, inputProps.max);
        amountRef.current?.dispatchEvent(
            new Event("change", { bubbles: true })
        );
        // (adapted from: https://coryrylan.com/blog/trigger-input-updates-with-react-controlled-inputs)
    };

    return (
        <Form.LabeledSet label={label} htmlFor={inputProps.id}>
            <div className="flex space-x-2">
                <div className="relative flex-1">
                    <Form.Input
                        type="number"
                        inputMode="decimal"
                        min={1 / Math.pow(10, tokenConfig.precision)}
                        step="any"
                        onWheel={amountInputPreventChangeOnScroll}
                        onInvalid={validateAmountField}
                        onInput={clearErrorMessages}
                        inputRef={amountRef}
                        {...inputProps}
                    />
                    <div className="absolute top-3 right-2">
                        <p className="text-sm text-gray-400">
                            {tokenConfig.symbol}
                        </p>
                    </div>
                </div>
                {inputProps.max ? (
                    <Button type="neutral" onClick={setMaxAmount}>
                        Max
                    </Button>
                ) : null}
            </div>
        </Form.LabeledSet>
    );
};

export const Form = {
    Label,
    Input,
    Select,
    TextArea,
    LabeledSet,
    FileInput,
    Checkbox,
    ChainAccountInput,
    AssetInput,
};

export default Form;
