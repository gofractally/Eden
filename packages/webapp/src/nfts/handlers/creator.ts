import { edenNftCreationTransaction } from "../transactions";
import { EdenNftCreationData, EdenNftData } from "../interfaces";
import { getTemplates } from "nfts/api";

export const createNft = async (
    ual: any,
    { inductors, nft }: EdenNftCreationData
) => {
    const assetsToMint = inductors.length + 2;

    if (inductors.length < 1) {
        throw new Error("At least one inductor is required");
    }

    if (
        !confirm(
            `By signing the following transaction, we are going to mint ${assetsToMint} NFTs. #1 goes to the eden community contract account, #2 goes to the new member ${nft.edenacc}, #3 goes to inviter account ${inductors[0]} and the rest goes to the remaining inductors. Do you want to proceed with the transaction?`
        )
    ) {
        return;
    }

    if (nft.social === "{}") {
        delete nft.social;
    }

    const authorizerAccount = ual.activeUser.accountName;
    const transaction = edenNftCreationTransaction(
        authorizerAccount,
        nft,
        assetsToMint
    );
    const signedTrx = await ual.activeUser.signTransaction(transaction, {
        broadcast: true,
    });
    console.info(signedTrx);
    // TODO: parse signedTrx.transaction.processed.action_traces[0].inline_traces[0].act
    // do we get that in EOS MainNet?
    // act.account = "atomicassets"
    // act.name = "lognewtempl"
    // act.data => read abi => act.data.template_id: 71543

    await sleep(3000);
    const createdTemplate = await getCreatedTemplate(nft);
    if (!createdTemplate) {
        throw new Error(
            "fail to create template. please check atomic assets and mint manually if necessary"
        );
    }

    console.info("created template", createdTemplate);
};

const getCreatedTemplate = async (
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
