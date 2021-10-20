import { CSSProperties } from "react";

interface Props {
    size?: number;
    className?: string;
    style?: CSSProperties;
}

export const MagnifyingGlass = ({
    size = 16,
    className = "",
    style,
}: Props) => (
    <svg
        id="Icon-Search-LtGray"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        className={`fill-current ${className}`}
        style={style}
    >
        <g
            id="Icon-Search-LtGray-2"
            data-name="Icon-Search-LtGray"
            transform="translate(-259 -3215)"
        >
            <path
                id="Path_8771"
                data-name="Path 8771"
                d="M631.531,346.367a4.026,4.026,0,1,1-4.025,4.025,4.03,4.03,0,0,1,4.025-4.025m0-1.8a5.824,5.824,0,1,0,5.825,5.823,5.823,5.823,0,0,0-5.825-5.823Zm8.017,13.863a.9.9,0,0,0,0-1.273l-2.186-2.186a.9.9,0,1,0-1.271,1.273l2.188,2.186a.9.9,0,0,0,1.271,0Z"
                transform="translate(-365.708 2871.432)"
            />
        </g>
    </svg>
);
