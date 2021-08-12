import { useCountdown } from "_app";
import { PieStatusIndicator, Text } from "_app/ui";

interface Props {
    startTime: Date;
    endTime: Date;
    className?: string;
    onEnd?: () => void;
}

export const VotePieMer = ({
    startTime,
    endTime,
    className = "",
    onEnd,
}: Props) => {
    const countdown = useCountdown({
        startTime,
        endTime,
        onEnd,
    });

    return (
        <div className={`flex items-center ${className}`}>
            <PieStatusIndicator
                percent={Math.round(countdown.percentDecimal * 100)}
                size={28}
            />
            <div className="flex-1 ml-2">
                <Text size="sm" className="font-semibold">
                    Vote Timer
                </Text>
                <Text size="sm">{countdown.hmmss}</Text>
            </div>
        </div>
    );
};
