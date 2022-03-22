import React, { useState } from "react";
import { RiDownloadLine } from "react-icons/ri";

import { tokenConfig } from "config";
import { useMemberByAccountName, useUALAccount } from "_app";
import { Asset, assetToLocaleString, getDefaultTokenAsset } from "_app/utils";
import { Button, Container, Heading, Text } from "_app/ui";
import { useAccountBalance, useAvailableDistributions } from "treasury/hooks";

import { NextDisbursementInfo, WithdrawModal } from "./withdraw-funds";

interface Props {
    account: string;
}

export const FundsAvailableCTA = ({ account }: Props) => {
    const [ualAccount] = useUALAccount();
    const { data: profile, isError: isErrorProfile } = useMemberByAccountName(
        account
    );
    const { data: accountBalance, isError: isErrorBalance } = useAccountBalance(
        account
    );
    const {
        data: distributionsResult,
        isError: isErrorDistributions,
    } = useAvailableDistributions(account);

    if (isErrorProfile || isErrorBalance || isErrorDistributions) return null;

    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    const availableFunds: Asset = getDefaultTokenAsset();
    if (accountBalance) availableFunds.quantity += accountBalance.quantity;
    if (distributionsResult?.sum) {
        availableFunds.quantity += distributionsResult.sum.quantity;
    }

    // delegates always see banner; others only if funds are available
    const isProfileDelegate = Boolean(profile?.election_rank);
    if (!isProfileDelegate && !availableFunds?.quantity) return null;

    const profileBelongsToCurrentUser = Boolean(
        ualAccount && profile && ualAccount.accountName === profile.account
    );

    return (
        <Container className="space-y-2.5">
            <div className="flex flex-wrap justify-between items-center space-y-2.5">
                <div>
                    <Heading size={4} className="hidden xs:block">
                        Eden funds available
                    </Heading>
                    <Heading size={4} className="block xs:hidden">
                        Funds available
                    </Heading>
                    <Text>
                        {availableFunds
                            ? assetToLocaleString(
                                  availableFunds,
                                  tokenConfig.precision
                              )
                            : "None"}
                    </Text>
                </div>
                {profileBelongsToCurrentUser && (
                    <Button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        disabled={
                            !availableFunds || availableFunds.quantity === 0
                        }
                    >
                        <RiDownloadLine className="-ml-1 mr-1" />
                        Withdraw
                    </Button>
                )}
            </div>
            {profileBelongsToCurrentUser && isProfileDelegate && (
                <NextDisbursementInfo />
            )}
            <WithdrawModal
                isOpen={isWithdrawModalOpen}
                close={() => setIsWithdrawModalOpen(false)}
                availableFunds={availableFunds}
                distributions={distributionsResult?.distributions}
            />
        </Container>
    );
};

export default FundsAvailableCTA;
