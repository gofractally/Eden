interface Props {
    percent: number;
    size: number;
    backgroundColor?: string;
    fillColor?: string;
}

export const PieStatusIndicator = ({
    percent = 0,
    size = 20,
    backgroundColor = "#e5e5e5",
    fillColor = "rgb(52, 211, 153)",
}: Props) => {
    const fillPercent = Math.min(percent, 100);
    return (
        <div className="pie" style={{ animationDelay: `-${fillPercent}s` }}>
            <style jsx>{`
                .pie {
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background-color: ${fillPercent === 100
                        ? fillColor
                        : backgroundColor};
                    background-image: linear-gradient(
                        to right,
                        transparent 50%,
                        ${fillColor} 0
                    );
                }
                @keyframes spin {
                    to {
                        transform: rotate(0.5turn);
                    }
                }
                @keyframes bg {
                    50% {
                        background: ${fillColor};
                    }
                }
                .pie::before {
                    content: "";
                    display: block;
                    margin-left: 50%;
                    height: 100%;
                    border-radius: 0 100% 100% 0 / 50%;
                    background-color: inherit;
                    transform-origin: left;
                    animation: spin 50s linear infinite,
                        bg 100s step-end infinite;
                    animation-play-state: paused;
                    animation-delay: inherit;
                }
            `}</style>
        </div>
    );
};
