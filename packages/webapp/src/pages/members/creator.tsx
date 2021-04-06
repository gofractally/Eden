import { useEffect } from "react";
import { UALProvider, withUAL } from "ual-reactjs-renderer";
import { Anchor } from "ual-anchor";

import { Button } from "ui";
import { ClientOnly } from "helpers";

const demoTransaction = {
    actions: [
        {
            account: "eosio.token",
            name: "transfer",
            authorization: [
                {
                    actor: "", // use account that was logged in
                    permission: "active",
                },
            ],
            data: {
                from: "", // use account that was logged in
                to: "edtdlarimer1",
                quantity: "1.00000000 WAX",
                memo: "UAL rocks!",
            },
        },
    ],
};

const rpcEndpoint = {
    protocol: process.env.NEXT_PUBLIC_EOS_RPC_PROTOCOL,
    host: process.env.NEXT_PUBLIC_EOS_RPC_HOST,
    port: Number(process.env.NEXT_PUBLIC_EOS_RPC_PORT),
};

const exampleNet = {
    chainId: process.env.NEXT_PUBLIC_EOS_CHAIN_ID,
    rpcEndpoints: [rpcEndpoint],
};

const MembersCreatorForm = ({ ual }: any) => {
    useEffect(() => {
        console.info(ual);
    }, [ual.activeUser]);

    const executeCreator = async () => {
        demoTransaction.actions[0].authorization[0].actor =
            ual.activeUser.accountName;
        demoTransaction.actions[0].data.from = ual.activeUser.accountName;
        try {
            await ual.activeUser.signTransaction(demoTransaction, {
                broadcast: true,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {ual.activeUser ? (
                <>
                    <div>
                        Welcome {ual.activeUser.accountName}{" "}
                        <Button outline onClick={ual.logout} className="ml-6">
                            Logout
                        </Button>
                    </div>
                    <Button onClick={executeCreator}>
                        Sign Test Transaction
                    </Button>
                </>
            ) : (
                <Button onClick={ual.showModal}>Login</Button>
            )}
        </div>
    );
};

const MembersCreatorUalForm = withUAL(MembersCreatorForm);

const anchor = new Anchor([exampleNet], {
    // Required: The app name, required by anchor-link. Short string identifying the app
    appName: "eden-community-app",
    // Optional: a @greymass/eosio APIClient from eosjs for both your use and to use internally in UAL
    // client = new APIClient({ provider }),
    // Optional: a JsonRpc instance from eosjs for your use
    // rpc: new JsonRpc(),
    // Optional: The callback service URL to use, defaults to https://cb.anchor.link
    // service: 'https://cb.anchor.link',
    // Optional: A flag to disable the Greymass Fuel integration, defaults to false (enabled)
    disableGreymassFuel: true,
    // Optional: An account name on a Fuel enabled network to specify as the referrer for transactions
    // fuelReferrer: 'teamgreymass',
    // Optional: A flag to enable the Anchor Link UI request status, defaults to true (enabled)
    // requestStatus: true,
    // Optional: Whether or not to verify the signatures during user login, defaults to false (disabled)
    // verifyProofs: false,
});

export const MembersCreatorPage = () => {
    return (
        <ClientOnly>
            <UALProvider
                chains={[exampleNet]}
                authenticators={[anchor]}
                appName={"Eden Community App"}
            >
                <MembersCreatorUalForm />
            </UALProvider>
        </ClientOnly>
    );
};

export default MembersCreatorPage;
