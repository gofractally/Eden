import { Asset, assetToString } from "_app";
import { edenContractAccount, tokenConfig } from "config";

import { DistributionAccount } from "delegates/interfaces";

export const withdrawAndTransfer = (
    authorizerAccount: string,
    totalWithdrawal: Asset,
    destinationAccount: string,
    memo: string,
    distributions: DistributionAccount[]
) => {
    if (!totalWithdrawal) {
        throw new Error("The current available balance to withdraw is zero");
    }

    const isThirdPartyTransfer = destinationAccount !== authorizerAccount;
    const amount = assetToString(totalWithdrawal, totalWithdrawal.precision);

    const authorization = [
        {
            actor: authorizerAccount,
            permission: "active",
        },
    ];

    const sweepAvailableDistributions = distributions.map((distribution) => ({
        account: edenContractAccount,
        name: "fundtransfer",
        authorization,
        data: {
            from: authorizerAccount,
            distribution_time: distribution.distribution_time,
            rank: distribution.rank,
            to: authorizerAccount,
            amount: distribution.balance,
            memo: "Claiming available delegate funds from EdenOS profile page",
        },
    }));

    const withdrawFunds = {
        account: edenContractAccount,
        name: "withdraw",
        authorization,
        data: {
            owner: authorizerAccount,
            quantity: amount,
        },
    };

    const transferToThirdParty = isThirdPartyTransfer
        ? [
              {
                  account: tokenConfig.contract,
                  name: "transfer",
                  authorization,
                  data: {
                      from: authorizerAccount,
                      to: destinationAccount,
                      quantity: amount,
                      memo,
                  },
              },
          ]
        : [];

    return {
        actions: [
            ...sweepAvailableDistributions,
            withdrawFunds,
            ...transferToThirdParty,
        ],
    };
};
