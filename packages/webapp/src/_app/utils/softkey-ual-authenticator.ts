import { Api, JsonRpc } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import {
    Authenticator,
    ButtonStyle,
    Chain,
    SignTransactionConfig,
    SignTransactionResponse,
    UALError,
    UALErrorType,
    User,
} from "universal-authenticator-library";

const AUTHENTICATOR_NAME = "Password";

export class SoftkeyUser extends User {
    private keys: string[] = [];
    private api: Api | null = null;
    private rpc: JsonRpc | null = null;

    // Default to WAX Testnet
    private chainId =
        "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12";

    constructor(private chain: Chain, private accountName: string) {
        super();

        if (chain?.chainId) {
            this.chainId = chain.chainId;
        }
    }

    public async init(privateKey: string) {
        console.log("init with privateKey:", privateKey);
        const rpcEndpoint = this.chain.rpcEndpoints[0];
        const rpcEndpointString = this.buildRpcEndpoint(rpcEndpoint);

        this.rpc = new JsonRpc(rpcEndpointString);
        this.api = new Api({
            rpc: this.rpc,
            signatureProvider: new JsSignatureProvider([privateKey]),
        });
    }

    // TODO: Implement
    public async signTransaction(
        transaction: any,
        // tslint:disable-next-line:variable-name
        _config: SignTransactionConfig
    ): Promise<SignTransactionResponse> {
        let result;

        try {
            // result = await window.lynxMobile.transact(transaction);

            return {
                wasBroadcast: true,
                transactionId: "boom",
                transaction: result,
            };
        } catch (e) {
            throw new Error("Error signing transaction");
        }
    }

    public async signArbitrary(
        _: string,
        data: string,
        helpText: string
    ): Promise<string> {
        throw new Error(
            "UAL Softkey Authenticator does not currently support signArbitrary"
        );
    }

    public async verifyKeyOwnership(_: string): Promise<boolean> {
        throw new Error(
            "UAL Softkey Authenticator does not currently support verifyKeyOwnership"
        );
    }

    public async getAccountName(): Promise<string> {
        return this.accountName;
    }

    public async getChainId(): Promise<string> {
        return this.chainId;
    }

    public async getKeys(): Promise<string[]> {
        return this.keys;
    }
}

export class SoftkeyAuthenticator extends Authenticator {
    private users: SoftkeyUser[] = [];
    private readonly supportedChains = {
        // SoftkeyAuthenticator only supports WAX Testnet
        f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12: {},
    };

    constructor(chains: Chain[]) {
        super(chains);
    }

    private supportsAllChains(): boolean {
        if (this.chains.length < 1) {
            return false;
        }

        for (const chain of this.chains) {
            if (!this.supportedChains.hasOwnProperty(chain.chainId)) {
                return false;
            }
        }
        return true;
    }

    public async init() {}

    public reset(): void {}

    public isErrored(): boolean {
        return false;
    }

    public getOnboardingLink(): string {
        return "https://github.com/eoscommunity/Eden";
    }

    public getError(): UALError | null {
        return null;
    }

    public isLoading(): boolean {
        return false;
    }

    // TODO: Style it up
    public getStyle(): ButtonStyle {
        return {
            icon: "./images/eden-logo-penta.svg",
            text: AUTHENTICATOR_NAME,
            textColor: "black",
            background: "gray",
        };
    }

    public shouldRender(): boolean {
        return this.supportsAllChains();
    }

    public shouldAutoLogin(): boolean {
        return this.shouldRender();
    }

    public async shouldRequestAccountName(): Promise<boolean> {
        return true;
    }

    // TODO: Add key to localstorage
    public async login(accountName?: string): Promise<User[]> {
        if (!accountName) throw new Error("Account name required");
        if (this.users.length !== 0) return this.users;
        this.users.push(new SoftkeyUser(this.chains[0], accountName));
        return this.users;
    }

    // TODO: Clear key from localstorage
    public async logout(): Promise<void> {
        this.users = [];
    }

    public requiresGetKeyConfirmation(): boolean {
        return false;
    }

    public getName(): string {
        return AUTHENTICATOR_NAME;
    }
}
