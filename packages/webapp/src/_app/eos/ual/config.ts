import { chainConfig, shortAppName } from "config";
import { Anchor } from "ual-anchor";
import { Scatter } from "ual-scatter";
import { Ledger } from "ual-ledger";

export const anchor = new Anchor([chainConfig], {
    // Required: The app name, required by anchor-link. Short string identifying the app
    appName: shortAppName,
    // Optional: a @greymass/eosio APIClient from eosjs for both your use and to use internally in UAL
    // client = new APIClient({ provider }),
    // Optional: a JsonRpc instance from eosjs for your use
    // rpc: new JsonRpc(),
    // Optional: The callback service URL to use, defaults to https://cb.anchor.link
    // service: 'https://cb.anchor.link',
    // Optional: A flag to disable the Greymass Fuel integration, defaults to false (enabled)
    // disableGreymassFuel: true,
    // Optional: An account name on a Fuel enabled network to specify as the referrer for transactions
    // fuelReferrer: 'teamgreymass',
    // Optional: A flag to enable the Anchor Link UI request status, defaults to true (enabled)
    // requestStatus: true,
    // Optional: Whether or not to verify the signatures during user login, defaults to false (disabled)
    // verifyProofs: false,
});

export const scatter = new Scatter([chainConfig], { appName: shortAppName });

export const ledger = new Ledger([chainConfig]);
