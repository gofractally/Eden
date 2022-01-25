import {
    Button,
    onError,
    SideNavLayout,
    useCurrentMember,
    useUALAccount,
} from "_app";
import {
    signAndBroadcastSessionTransaction,
    generateSessionKey,
    newSessionTransaction,
    sessionKeysStorage,
} from "_app/eos/sessions";
import { initializeInductionTransaction } from "inductions";

export const Sessions = () => {
    const { data: currentMember } = useCurrentMember();
    const [ualAccount] = useUALAccount();

    // Example to be called when user logs in to eden or when the session is expiring
    // and a new one is desired
    const onCreateSessionExample = async () => {
        try {
            const newSessionKey = await generateSessionKey();
            console.info("created session key", newSessionKey);

            const transaction = await newSessionTransaction(
                ualAccount.accountName,
                newSessionKey
            );
            console.info("generated newsession transaction", transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("newsession signedTrx", signedTrx);

            await sessionKeysStorage.saveKey(newSessionKey);

            return { newSessionKey };
        } catch (e) {
            console.error(e);
            onError(e as Error);
        }
    };

    const onRunSessionExample = async () => {
        try {
            const {
                transaction: inductionTrx,
            } = initializeInductionTransaction(ualAccount.accountName, "ahab", [
                "pip",
                "egeon",
            ]);

            // extract the actions from the transaction
            const { actions } = inductionTrx;

            // sign actions with session key
            await signAndBroadcastSessionTransaction(
                ualAccount.accountName,
                actions
            );
        } catch (e) {
            console.error(e);
            onError(e as Error);
        }
    };

    return (
        <SideNavLayout>
            <div className="p-4 space-y-3 flex flex-col">
                <p>Hi, {currentMember?.account}! Testing Sessions</p>
                <Button onClick={onCreateSessionExample}>
                    Create Session Key
                </Button>
                <Button onClick={onRunSessionExample}>
                    Induct Ahab with Pip and Egeon
                </Button>
            </div>
        </SideNavLayout>
    );
};

export default Sessions;
