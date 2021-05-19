import { useState } from "react";

import { onError } from "../utils";

export type SetValuesEvent = (event?: {
    target: { id: string; value: any };
}) => void;

export const useFormFields = <T>(initialState: T): [T, SetValuesEvent] => {
    const [fields, setValues] = useState<T>(initialState);

    return [
        fields,
        (event = undefined) => {
            if (!event) {
                setValues(initialState);
                return;
            }

            setValues({
                ...fields,
                [event.target.id]: event.target.value,
            });
        },
    ];
};

export const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mimePrefix: string,
    maxSize: number,
    setFile: (file: File) => void
) => {
    e.preventDefault();

    if (!e.target.files || !e.target.files.length) {
        return;
    }

    var file = e.target.files[0];

    if (!file.type.match(`${mimePrefix}.*`)) {
        return onError(new Error(`You can only select ${mimePrefix} files`));
    }

    if (file.size > maxSize) {
        return onError(
            new Error(
                `The file cannot be larger than ${Math.floor(
                    maxSize / 1_000_000
                )} Mb`
            )
        );
    }

    setFile(file);
};
