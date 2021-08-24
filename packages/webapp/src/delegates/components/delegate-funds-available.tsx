import { useState } from "react";
import {
    assetToString,
    Button,
    Heading,
    onError,
    sumAssetStrings,
    Text,
    useDistributionsForAccount,
    useMemberByAccountName,
    useUALAccount,
} from "_app";

import { withdrawDelegateAvailableFunds } from "../transactions";

interface Props {
    account: string;
}

export const DelegateFundsAvailable = ({ account }: Props) => {
    const [ualAccount] = useUALAccount();
    const { data: member } = useMemberByAccountName(account);
    const { data: distributions } = useDistributionsForAccount(account);
    const [isLoading, setIsLoading] = useState(false);

    const availableFunds = distributions
        ? sumAssetStrings(
              distributions.map((distribution) => distribution.balance)
          )
        : undefined;

    // omit component if it's not a current delegate and available funds are empty
    if ((!member || !member.election_rank) && !availableFunds) {
        return null;
    }

    const submitWithdraw = async () => {
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const trx = withdrawDelegateAvailableFunds(
                authorizerAccount,
                distributions!
            );
            console.info("signing trx", trx);

            const signedTrx = await ualAccount.signTransaction(trx, {
                broadcast: true,
            });
            console.info("withdraw delegate available funds trx", signedTrx);
        } catch (error) {
            console.error(error);
            onError(error.message);
        }

        setIsLoading(false);
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <div>
                    <Heading size={3}>Delegate funds available</Heading>
                    <Text>
                        {availableFunds
                            ? assetToString(availableFunds)
                            : "None"}
                    </Text>
                </div>
                <div>
                    {ualAccount?.accountName === member?.account && (
                        <Button
                            onClick={submitWithdraw}
                            disabled={
                                isLoading ||
                                !availableFunds ||
                                availableFunds.quantity === 0
                            }
                            isLoading={isLoading}
                        >
                            Withdraw
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
};
