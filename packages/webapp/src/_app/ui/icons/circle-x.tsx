import { CSSProperties } from "react";

interface Props {
    size?: number;
    className?: string;
    style?: CSSProperties;
}

export const CircleX = ({ size = 16, className = "", style }: Props) => (
    <svg
        id="Icon-Close-LtGray"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        className={`fill-current ${className}`}
        style={style}
    >
        <g
            id="Icon-Close-LtGray-2"
            data-name="Icon-Close-LtGray"
            transform="translate(-259 -3238)"
        >
            <g
                id="Group_12037"
                data-name="Group 12037"
                transform="translate(260 3239)"
            >
                <path
                    id="Path_8769"
                    data-name="Path 8769"
                    d="M632.681,352.1a6.97,6.97,0,1,0,6.97,6.97A6.97,6.97,0,0,0,632.681,352.1Zm0,12.142a5.172,5.172,0,1,1,5.172-5.172A5.178,5.178,0,0,1,632.681,364.246Z"
                    transform="translate(-625.709 -352.104)"
                />
                <path
                    id="Path_8770"
                    data-name="Path 8770"
                    d="M633.172,354.441a.9.9,0,0,0-1.271,0l-1.291,1.291-1.293-1.291a.9.9,0,0,0-1.271,1.271L629.338,357l-1.291,1.291a.9.9,0,1,0,1.271,1.273l1.293-1.291,1.291,1.291a.9.9,0,0,0,1.271-1.273L631.882,357l1.291-1.291A.9.9,0,0,0,633.172,354.441Z"
                    transform="translate(-623.638 -350.034)"
                />
            </g>
        </g>
    </svg>
);
