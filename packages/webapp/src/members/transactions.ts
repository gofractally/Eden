import { Asset, assetFromString, assetToString } from "_app";
import { edenContractAccount, tokenConfig } from "config";

import { DistributionAccount } from "delegates/interfaces";

export const withdrawAndTransfer = (
    authorizerAccount: string,
    totalWithdrawal: Asset,
    destinationAccount: string,
    memo: string,
    distributions?: DistributionAccount[]
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

    const sweepAvailableDistributions =
        distributions
            ?.filter((d) => assetFromString(d.balance).quantity > 0)
            .map((distribution) => {
                const { distributionTime, rank, balance } = distribution;
                return {
                    account: edenContractAccount,
                    name: "fundtransfer",
                    authorization,
                    data: {
                        from: authorizerAccount,
                        distribution_time: distributionTime.replace(/Z$/, ""),
                        rank,
                        to: authorizerAccount,
                        amount: balance,
                        memo:
                            "Claiming available delegate funds from EdenOS profile page",
                    },
                };
            }) ?? [];

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
