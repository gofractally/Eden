import { useQuery as useBoxQuery } from "@edenos/common/dist/subchain";
import { assetFromString, assetToLocaleString } from "_app";

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

    const balanceAsAsset = assetFromString(amount);
    const balanceAsString = amount;

    return { ...result, data: { balanceAsAsset, balanceAsString } };
};
