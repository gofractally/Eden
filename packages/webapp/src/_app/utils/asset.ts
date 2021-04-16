export interface Asset {
    quantity: number; // integer without decimals
    symbol: string;
    precision: number;
}

export const assetFromString = (asset: string): Asset => {
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

export const assetToString = (price: Asset, decimals = 2) =>
    `${(price.quantity / Math.pow(10, price.precision)).toFixed(decimals)} ${
        price.symbol
    }`;
