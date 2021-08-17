import { devUseFixtureData } from "config";
import { CONTRACT_ENCRYPTED_TABLE, getRow } from "_app";
import { EncryptedData } from "../interfaces";
import { fixtureEncryptedData } from "./fixtures";

export const getEncryptedData = async (
    id: string
): Promise<EncryptedData | undefined> => {
    if (devUseFixtureData) {
        return { ...fixtureEncryptedData, id };
    }
    return getRow<EncryptedData>(CONTRACT_ENCRYPTED_TABLE, "id", id);
};
