import React from "react";

import { useFocus } from "_app";
import { CircleX, MagnifyingGlass } from "_app/ui/icons";

export interface SearchProps {
    onClear: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: string;
    id: string;
    [x: string]: any;
}

export const Search = ({ onClear, id, ...inputProps }: SearchProps) => {
    const [inputRef, setInputFocus] = useFocus<HTMLInputElement>();
    return (
        <div
            className={`flex-1 flex items-center pl-2.5 text-gray-300 focus-within:text-gray-400 transition-colors ${
                inputProps.value && "text-gray-400"
            }`}
        >
            <div
                className="py-2.5 hover:text-gray-400 cursor-pointer"
                onClick={() => setInputFocus({ preventScroll: true })}
            >
                <MagnifyingGlass size={18} />
            </div>
            <input
                id={id}
                name={id}
                type="text"
                autoComplete="off"
                className="flex-1 h-14 focus:ring-0 border-none placeholder-gray-300 text-lg"
                placeholder="find member"
                ref={inputRef}
                {...inputProps}
            />
            {inputProps.value ? (
                <div
                    className="flex items-center p-2.5 text-gray-400 hover:text-gray-500 cursor-pointer"
                    onClick={onClear}
                >
                    <CircleX size={18} />
                </div>
            ) : null}
        </div>
    );
};

export default Search;
