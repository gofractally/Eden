export interface Asset {
    quantity: number; // integer without decimals
    symbol: string;
    precision: number;
}

export const assetFromString = (asset: string): Asset => {
    const re = /^[0-9]+\.[0-9]+ [A-Z,a-z]{1,5}$/
    if(asset.match(re) === null) {
        return {
            symbol: "ERR",
            quantity: 0.0,
            precision: 2
        }
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

export const assetToString = (price: Asset, decimals = 2) =>
    `${(price ? (price.quantity / Math.pow(10, price.precision)).toFixed(decimals) : "Format Error")} ${
        price && price.symbol
    }`;
