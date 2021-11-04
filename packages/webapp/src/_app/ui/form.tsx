import React, { HTMLProps } from "react";

export const Label: React.FC<{
    htmlFor: string;
}> = (props) => (
    <label className="block text-sm font-normal text-gray-600" {...props}>
        {props.children}
    </label>
);

export const Input: React.FC<HTMLProps<HTMLInputElement>> = (props) => (
    <input
        name={props.id}
        className={`w-full bg-white border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out ${
            props.disabled ? "bg-gray-50" : ""
        }`}
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

export const Form = {
    Label,
    Input,
    Select,
    TextArea,
    LabeledSet,
    FileInput,
    Checkbox,
};

export default Form;
