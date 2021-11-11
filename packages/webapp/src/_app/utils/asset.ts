import { tokenConfig } from "config";

export interface Asset {
    quantity: number; // integer without decimals
    symbol: string;
    precision: number;
}

export const getDefaultTokenAsset = () => ({
    quantity: 0,
    symbol: tokenConfig.symbol,
    precision: tokenConfig.precision,
});

export const assetFromString = (asset: string): Asset => {
    const re = /^[0-9]+\.[0-9]+ [A-Z,a-z]{1,5}$/;
    if (asset.match(re) === null) {
        throw new Error(`Invalid Asset value: ${asset}`);
    }
    const [quantityString, symbol] = asset.split(" ");
    const [integer, decimals] = quantityString.split(".");
    const precision = decimals.length;
    const quantity = parseInt(`${integer}${decimals}`);
    return {
        symbol,
        quantity,
        precision,
    };
};

/**
 * Convert a number to an Asset with the community-configured token symbol and precision
 * @param {number} value - a number that can contain a decimal
 * @returns {Asset} the Asset with the community's default token symbol and precision
 */
export const assetFromNumber = (value: number): Asset => ({
    symbol: tokenConfig.symbol,
    precision: tokenConfig.precision,
    quantity: value * Math.pow(10, tokenConfig.precision),
});

export const assetToString = (price: Asset, decimals = 2) =>
    `${(price.quantity / Math.pow(10, price.precision)).toFixed(decimals)} ${
        price.symbol
    }`;

export const assetToLocaleString = (price: Asset, decimals = 2) =>
    `${(price.quantity / Math.pow(10, price.precision)).toLocaleString(
        undefined,
        {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }
    )} ${price.symbol}`;

export const sumAssetStrings = (assets: string[]): Asset | undefined => {
    if (!assets.length) {
        return undefined;
    }

    const [firstAsset, ...parsedAssets] = assets.map(assetFromString);

    return parsedAssets.reduce((prev, curr) => {
        if (prev.symbol !== curr.symbol) {
            throw new Error(
                "invalid operation: can't summarize different asset symbols"
            );
        }

        prev.quantity += curr.quantity;
        return prev;
    }, firstAsset);
};
