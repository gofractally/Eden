import { assetToString, sumAssetStrings } from "_app";
import { edenContractAccount } from "config";

import { DistributionAccount } from "./interfaces";

export const withdrawDelegateAvailableFunds = (
    authorizerAccount: string,
    distributions: DistributionAccount[]
) => {
    const totalWithdraw = sumAssetStrings(
        distributions.map((distribution) => distribution.balance)
    );

    if (!totalWithdraw) {
        throw new Error("The current available balance to withdraw is zero");
    }

    return {
        actions: [
            ...distributions.map((distribution) => ({
                account: edenContractAccount,
                name: "fundtransfer",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    from: authorizerAccount,
                    distribution_time: distribution.distribution_time,
                    rank: distribution.rank,
                    to: authorizerAccount,
                    amount: distribution.balance,
                    memo: "Total withdraw from EdenWebApp UI Profile Page",
                },
            })),
            {
                account: edenContractAccount,
                name: "withdraw",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    owner: authorizerAccount,
                    quantity: assetToString(
                        totalWithdraw,
                        totalWithdraw.precision
                    ),
                },
            },
        ],
    };
};
