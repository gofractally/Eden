import { CSSProperties } from "react";

interface Props {
    size?: number;
    className?: string;
    style?: CSSProperties;
}

export const NFT = ({ size = 16, className = "", style }: Props) => (
    <svg
        id="nft-icon"
        data-name="nft-icon"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size * 0.7}
        viewBox="0 0 16.561 8.968"
        className={`fill-current ${className}`}
        style={style}
    >
        <path
            id="Path_8782"
            data-name="Path 8782"
            d="M1201.572,227.9a2.58,2.58,0,0,0-2.539,2.668v6.3h1.883v-3.537h2.3V231.75h-2.3v-.6c0-.8.326-1.554,1.361-1.554h3v7.27h1.883v-7.27h2.6v-1.7Z"
            transform="translate(-1193.204 -227.898)"
        />
        <path
            id="Path_8786"
            data-name="Path 8786"
            d="M1198.213,232.659a21.168,21.168,0,0,0-2.61-4.761h-2.4v8.967h1.79v-6.608l3.868,6.608A12.619,12.619,0,0,0,1198.213,232.659Z"
            transform="translate(-1193.204 -227.898)"
        />
    </svg>
);
