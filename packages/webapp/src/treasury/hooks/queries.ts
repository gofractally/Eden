import { useQuery as useBoxQuery } from "@edenos/eden-subchain-client/dist/ReactSubchain";

import { DistributionAccount } from "delegates/interfaces";
import { assetFromString, sumAssetStrings } from "_app";

export interface AccountBalanceQuery {
    balances: {
        edges: {
            node: {
                amount: string;
            };
        }[];
    };
}

export const useAccountBalance = (account: string) => {
    const result = useBoxQuery<AccountBalanceQuery>(`{
        balances(ge: "${account}", le: "${account}") {
            edges {
                node {
                    amount
                }
            }
        }
    }`);

    const amount = result.data?.balances?.edges?.[0]?.node?.amount;
    if (!amount) return { ...result, data: null };

    const balance = assetFromString(amount);

    return { ...result, data: balance };
};

export interface AvailableDistributionsQuery {
    members: {
        edges: {
            node: {
                distributionFunds: {
                    edges: {
                        node: {
                            owner: {
                                account: string;
                            };
                            distributionTime: string;
                            rank: number;
                            currentBalance: string;
                        };
                    }[];
                };
            };
        }[];
    };
}

export const useAvailableDistributions = (account: string) => {
    const result = useBoxQuery<AvailableDistributionsQuery>(`{
        members(ge: "${account}", le: "${account}") {
            edges {
                node {
                    distributionFunds {
                        edges {
                            node {
                                owner {
                                    account
                                }
                                distributionTime
                                rank
                                currentBalance
                            }
                        }
                    }
                }
            }
        }
    }`);

    const distributionFunds =
        result.data?.members?.edges?.[0]?.node?.distributionFunds?.edges;

    if (!distributionFunds?.length) return { ...result, data: null };

    const distributions: DistributionAccount[] = distributionFunds.map(
        (fund) => ({
            owner: fund.node.owner.account,
            distribution_time: fund.node.distributionTime,
            rank: fund.node.rank,
            balance: fund.node.currentBalance,
        })
    );

    const sum = sumAssetStrings(distributions.map((dist) => dist.balance));

    return { ...result, data: { distributions, sum } };
};
