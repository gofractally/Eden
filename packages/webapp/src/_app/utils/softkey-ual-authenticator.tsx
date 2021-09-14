import { Api, JsonRpc } from "eosjs";
import { SignatureProvider } from "eosjs/dist/eosjs-api-interfaces";
import { JsSignatureProvider, PublicKey } from "eosjs/dist/eosjs-jssig";
import React from "react";
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

import { useFormFields } from "_app/hooks";
import {
    UALSoftKeyLoginHook,
    useUALSoftkeyLogin,
} from "_app/hooks/softkey-ual";
import { Button, Form, Modal } from "_app/ui";

const AUTHENTICATOR_NAME = "Password";
const UAL_SOFTKEY_STORAGE_KEY = "ualSoftKey";

class UALSoftkeyError extends UALError {
    constructor(
        message: string,
        type: UALErrorType,
        cause: Error | null = null
    ) {
        super(message, type, cause, "Soft Key");
    }
}

export class SoftkeyUser extends User {
    public signatureProvider: SignatureProvider | undefined;
    private api: Api | undefined;
    private rpc: JsonRpc | undefined;

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

        try {
            this.rpc = new JsonRpc(rpcEndpointString);
            this.signatureProvider = new JsSignatureProvider([privateKey]);
            this.api = new Api({
                rpc: this.rpc,
                signatureProvider: this.signatureProvider,
            });
        } catch (e) {
            throw new UALSoftkeyError(
                `Fail to initialize Softkey EOS RPC/Api`,
                UALErrorType.Initialization,
                e
            );
        }

        if (!(await this.isAccountValid())) {
            localStorage.removeItem(UAL_SOFTKEY_STORAGE_KEY);
            throw new UALSoftkeyError(
                `Invalid password for account ${this.accountName}`,
                UALErrorType.Initialization
            );
        }

        localStorage.setItem(UAL_SOFTKEY_STORAGE_KEY, privateKey);
    }

    private async isAccountValid(): Promise<boolean> {
        try {
            const account =
                this.rpc && (await this.rpc.get_account(this.accountName));
            const actualKeys = this.extractAccountKeys(account);
            const authorizationKeys = await this.getKeys();
            const legacyAuthorizationKeys = authorizationKeys.map((key) =>
                PublicKey.fromString(key).toLegacyString()
            );

            console.info(legacyAuthorizationKeys, actualKeys);

            return (
                actualKeys.filter((key) => {
                    return legacyAuthorizationKeys.indexOf(key) !== -1;
                }).length > 0
            );
        } catch (e) {
            throw new UALSoftkeyError(
                `Account validation failed for account ${this.accountName}.`,
                UALErrorType.Validation,
                e
            );
        }
    }

    private extractAccountKeys(account: any): string[] {
        const keySubsets = account.permissions.map((permission: any) =>
            permission.required_auth.keys.map((key: any) => key.key)
        );
        let keys: string[] = [];
        for (const keySubset of keySubsets) {
            keys = keys.concat(keySubset);
        }
        return keys;
    }

    public async signTransaction(
        transaction: any,
        config?: SignTransactionConfig
    ): Promise<SignTransactionResponse> {
        try {
            const result = await this.api?.transact(transaction, {
                blocksBehind: 3,
                expireSeconds: 30,
                broadcast: true,
                ...config,
            });
            return result;
        } catch (e) {
            throw new UALSoftkeyError(
                `Error signing transaction: ${e.message}`,
                UALErrorType.Signing,
                e
            );
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
        return this.signatureProvider?.getAvailableKeys() || [];
    }
}

export class SoftkeyAuthenticator extends Authenticator {
    private users: SoftkeyUser[] = [];
    private readonly supportedChains = {
        // SoftkeyAuthenticator only supports WAX Testnet
        f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12: {},
    };

    constructor(chains: Chain[], private loginHook: UALSoftKeyLoginHook) {
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

    public async login(accountName?: string): Promise<User[]> {
        if (!accountName) throw new Error("Account name required");
        const privateKey =
            localStorage.getItem(UAL_SOFTKEY_STORAGE_KEY) ||
            (await this.loginHook.show());
        if (!privateKey) {
            throw new UALSoftkeyError("Empty password.", UALErrorType.Login);
        }
        for (const chain of this.chains) {
            const user = new SoftkeyUser(chain, accountName);
            await user.init(privateKey);
            this.users.push(user);
        }
        return this.users;
    }

    public async logout(): Promise<void> {
        localStorage.removeItem(UAL_SOFTKEY_STORAGE_KEY);
        this.users = [];
    }

    public requiresGetKeyConfirmation(): boolean {
        return false;
    }

    public getName(): string {
        return AUTHENTICATOR_NAME;
    }
}

export const UalSoftKeyModals = () => {
    const { isOpen, dismiss } = useUALSoftkeyLogin();
    const [fields, setFields] = useFormFields({
        password: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const close = () => {
        alert(
            "You can't close the authentication modal without confirming or cancelling the password form."
        );
    };

    const onCancel = () => {
        dismiss("");
    };

    const doSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dismiss(fields.password);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="UAL SoftKey Login"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            <form onSubmit={doSubmit} className="space-y-3">
                <Form.LabeledSet
                    label="Your Account Password"
                    htmlFor="password"
                    className="col-span-6 sm:col-span-3"
                >
                    <Form.Input
                        id="password"
                        type="text"
                        required
                        value={fields.password}
                        onChange={onChangeFields}
                    />
                </Form.LabeledSet>
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button isSubmit>Submit</Button>
                </div>
            </form>
        </Modal>
    );
};
