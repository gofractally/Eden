import React from "react";
import { Button, Heading, Text } from "_app/ui";

interface Props {
    dismiss: () => void;
    tryAgain: () => void;
    errorMessage: string;
}

export const WithdrawModalStepFailure = ({
    dismiss,
    tryAgain,
    errorMessage,
}: Props) => {
    return (
        <div className="space-y-4">
            <Heading>Error</Heading>
            <Text>There was a problem processing your transaction</Text>
            {errorMessage ? <Text type="note">{errorMessage}</Text> : null}
            <div className="flex space-x-3">
                <Button onClick={dismiss} type="neutral">
                    Dismiss
                </Button>
                <Button onClick={tryAgain}>Try again</Button>
            </div>
        </div>
    );
};

export default WithdrawModalStepFailure;
