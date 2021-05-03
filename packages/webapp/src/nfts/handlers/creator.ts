import {
    edenNftCreationTransaction,
    edenNftMintTransaction,
} from "../transactions";
import { EdenNftData } from "../interfaces";
import { getTemplates } from "nfts/api";
import { edenContractAccount } from "config";

export const validateAndConfirmCreation = (
    nft: EdenNftData,
    inductors: string[],
    assetsToMint: number
): boolean => {
    if (inductors.length < 1) {
        throw new Error("At least one inductor is required");
    }

    return confirm(
        `By signing the following transaction, we are going to mint ${assetsToMint} NFTs. #1 goes to the eden community on account ${edenContractAccount}, #2 goes to the new member ${nft.account}, #3 goes to inviter account ${inductors[0]} and the rest goes to the remaining inductors. Do you want to proceed with the transaction?`
    );
};

export const createNft = async (
    ual: any,
    nft: EdenNftData,
    assetsToMint: number
): Promise<number> => {
    if (nft.social === "{}") {
        delete nft.social;
    }

    const authorizerAccount = ual.activeUser.accountName;
    const createTemplateTransaction = edenNftCreationTransaction(
        authorizerAccount,
        nft,
        assetsToMint
    );
    const signedCreateTemplTrx = await ual.activeUser.signTransaction(
        createTemplateTransaction,
        {
            broadcast: true,
        }
    );
    console.info("create templ transaction", signedCreateTemplTrx);

    // TODO: parse signedTrx.transaction.processed.action_traces[0].inline_traces[0].act
    // do we get that in EOS MainNet?
    // act.account = "atomicassets"
    // act.name = "lognewtempl"
    // act.data => read abi => act.data.template_id: 71543
    await sleep(3000);

    const createdTemplateId = await getcreatedTemplateId(nft);
    if (!createdTemplateId) {
        throw new Error(
            "fail to create template. please check atomic assets to make sure the template was not created"
        );
    }
    return createdTemplateId;
};

export const mintAssets = async (
    ual: any,
    templateId: number,
    account: string,
    inductors: string[]
) => {
    const authorizerAccount = ual.activeUser.accountName;
    const mintingTransaction = edenNftMintTransaction(
        authorizerAccount,
        templateId,
        [edenContractAccount, account, ...inductors]
    );
    const signedMintingTrx = await ual.activeUser.signTransaction(
        mintingTransaction,
        {
            broadcast: true,
        }
    );
    console.info("mint transaction", signedMintingTrx);
};

const getcreatedTemplateId = async (
    createdNft: EdenNftData
): Promise<number | undefined> => {
    const lastCreatedTemplates = await getTemplates(
        1,
        100,
        [],
        "created",
        "desc"
    );
    const template = lastCreatedTemplates.find(
        (t) =>
            t.immutable_data.name === createdNft.name &&
            t.immutable_data.img === createdNft.img
    );
    return template ? parseInt(template.template_id) : undefined;
};

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
