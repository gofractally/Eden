import React from "react";

import { blockExplorerTransactionBaseUrl } from "config";
import { Button, Heading, Text, OpensInNewTabIcon } from "_app/ui";

interface Props {
    isThirdPartyTransfer: boolean;
    dismiss: () => void;
    transactionId: string;
}

export const WithdrawModalStepSuccess = ({
    isThirdPartyTransfer,
    dismiss,
    transactionId,
}: Props) => {
    return (
        <div className="space-y-4">
            <Heading>
                Withdrawal {isThirdPartyTransfer && "and transfer"} complete
            </Heading>
            <Text>Your transaction was successful.</Text>
            <div className="flex space-x-3">
                <Button onClick={dismiss}>Dismiss</Button>
                <Button
                    type="link"
                    isExternal
                    target="_blank"
                    href={`${blockExplorerTransactionBaseUrl}/${transactionId}`}
                >
                    View transaction
                    <OpensInNewTabIcon />
                </Button>
            </div>
        </div>
    );
};

export default WithdrawModalStepSuccess;
