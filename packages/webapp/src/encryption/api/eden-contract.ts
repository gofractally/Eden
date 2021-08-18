import { devUseFixtureData } from "config";
import { hexToUint8Array } from "eosjs/dist/eosjs-serialize";

import { CONTRACT_ENCRYPTED_TABLE, getRow } from "_app";
import { EncryptedData } from "../interfaces";
import { fixtureEncryptedData } from "./fixtures";

export type EncryptionScope = "election" | "induction";

export const getEncryptedData = async (
    scope: EncryptionScope,
    id: string
): Promise<EncryptedData | undefined> => {
    if (devUseFixtureData) {
        return { ...fixtureEncryptedData, id };
    }

    const encryptedData = await getRow<EncryptedData>(
        CONTRACT_ENCRYPTED_TABLE,
        "id",
        id,
        scope
    );

    // convert rpc response from hex to bytes
    if (encryptedData) {
        encryptedData.data = hexToUint8Array(
            (encryptedData.data as unknown) as string
        );
        encryptedData.keys.forEach((key) => {
            key.key = hexToUint8Array((key.key as unknown) as string);
        });
    }

    return encryptedData;
};
