import { edenNftCreationTransaction } from "../transactions";
import { EdenNftCreationData } from "../interfaces";

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
            `By signing the following transaction, we are going to mint ${assetsToMint} NFTs. #1 goes to the eden community contract account, #2 goes to the new member ${nft.edenacc}, #3 goes to inviter account ${inductors[0]} and the rest goes to the remaining inductors. Do you agree?`
        )
    ) {
        return;
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
};
