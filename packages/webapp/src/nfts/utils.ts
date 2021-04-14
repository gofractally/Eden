import { NftPrice } from "./interfaces";

export const nftPriceToString = (price: NftPrice) =>
    `${(price.quantity / Math.pow(10, price.precision)).toFixed(2)} ${
        price.symbol
    }`;
