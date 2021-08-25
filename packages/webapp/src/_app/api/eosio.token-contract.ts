import { minimumDonationAmount } from "config";
import { Asset, assetFromString } from "_app/utils";
import { eosJsonRpc } from "../eos";

export const getTokenBalanceForAccount = async (
    account: string
): Promise<Asset> => {
    const data = await eosJsonRpc.get_currency_balance(
        "eosio.token",
        account,
        minimumDonationAmount.symbol
    );

    if (data && data.length) {
        return assetFromString(data[0]);
    } else {
        return { ...minimumDonationAmount, quantity: 0.0 };
    }
};
