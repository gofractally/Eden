import { Asset, assetToString } from "_app";
import { edenContractAccount } from "config";

import { DistributionAccount } from "./interfaces";

export const withdrawAvailableFunds = (
    authorizerAccount: string,
    totalWithdrawal: Asset,
    distributions: DistributionAccount[]
) => {
    if (!totalWithdrawal) {
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
                    memo:
                        "Claiming all available delegate funds from EdenOS profile page",
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
                        totalWithdrawal,
                        totalWithdrawal.precision
                    ),
                },
            },
        ],
    };
};
