import React from "react";

import { useFocus } from "_app";
import { CircleX, MagnifyingGlass } from "_app/ui/icons";

interface Props {
    onClear: () => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    [x: string]: any;
}

export const DesktopMembersSearch = ({ onClear, ...inputProps }: Props) => (
    <div className="h-14 relative hidden lg:flex justify-end flex-1 max-w-md overflow-hidden">
        <div className={`search-expander ${inputProps.value && "expanded"}`}>
            <MembersSearch onClear={onClear} {...inputProps} />
        </div>
        <style jsx>{`
            .search-expander {
                position: absolute;
                transition: width 0.5s ease;
                width: 32px;
                overflow: hidden;
            }
            .search-expander:focus-within {
                width: 100%;
            }
            .search-expander.expanded {
                width: 100%;
            }
        `}</style>
    </div>
);

export const MembersSearch = ({ onClear, ...inputProps }: Props) => {
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
                id="memberSearch"
                name="memberSearch"
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
