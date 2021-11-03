import React, { useState } from "react";
import { RiDownloadLine } from "react-icons/ri";

import { tokenConfig } from "config";
import {
    Asset,
    assetToLocaleString,
    sumAssetStrings,
    useDistributionsForAccount,
    useMemberByAccountName,
    useUALAccount,
} from "_app";
import { Button, Container, Heading, Text } from "_app/ui";
import { useAccountBalance } from "treasury/hooks";

import { NextDisbursementInfo, WithdrawModal } from "./withdraw-funds";

interface Props {
    account: string;
}

export const FundsAvailableCTA = ({ account }: Props) => {
    const [ualAccount] = useUALAccount();
    const { data: profile } = useMemberByAccountName(account);
    const {
        data: accountBalance,
        isLoading: isLoadingAccountBalance,
        isError: isErrorAccountBalance,
    } = useAccountBalance(account);
    const { data: distributions } = useDistributionsForAccount(account);

    const [isLoading, setIsLoading] = useState(false); // TODO: is this loading state necessary?
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    let availableFunds: Asset | undefined = undefined;
    if (accountBalance && distributions) {
        const assetStrings = [
            ...distributions.map((distribution) => distribution.balance),
            accountBalance.balanceAsString,
        ];
        availableFunds = sumAssetStrings(assetStrings);
    }

    const isProfileDelegate = Boolean(profile?.election_rank);

    if (!isProfileDelegate && !availableFunds?.quantity) return null;

    const profileBelongsToCurrentUser = Boolean(
        ualAccount && profile && ualAccount.accountName === profile.account
    );

    return (
        <Container className="space-y-2.5">
            <div className="flex justify-between items-center">
                <div>
                    <Heading size={4}>Funds available</Heading>
                    <Text>
                        {availableFunds
                            ? assetToLocaleString(
                                  availableFunds,
                                  tokenConfig.precision
                              )
                            : "None"}
                    </Text>
                </div>
                <div>
                    {profileBelongsToCurrentUser && (
                        <Button
                            onClick={() => setIsWithdrawModalOpen(true)}
                            disabled={
                                isLoading ||
                                !availableFunds ||
                                availableFunds.quantity === 0
                            }
                            isLoading={isLoading}
                        >
                            {!isLoading && (
                                <RiDownloadLine className="-ml-1 mr-1" />
                            )}
                            Withdraw
                        </Button>
                    )}
                </div>
            </div>
            {profileBelongsToCurrentUser && isProfileDelegate && (
                <NextDisbursementInfo />
            )}
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                close={() => setIsWithdrawModalOpen(false)}
                availableFunds={availableFunds}
                distributions={distributions}
            />
        </Container>
    );
};

export default FundsAvailableCTA;
