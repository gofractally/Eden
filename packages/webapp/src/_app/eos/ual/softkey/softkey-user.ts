import { setEncryptionPublicKeyTransaction } from "encryption";
import { Api, JsonRpc } from "eosjs";
import { SignatureProvider } from "eosjs/dist/eosjs-api-interfaces";
import {
    JsSignatureProvider,
    PrivateKey,
    PublicKey,
} from "eosjs/dist/eosjs-jssig";
import {
    Chain,
    SignTransactionConfig,
    SignTransactionResponse,
    UALErrorType,
    User,
} from "universal-authenticator-library";

import { getEdenMember } from "members";

import { UALSoftKeyLoginHook } from "./hooks";
import { UALSoftkeyError, UAL_SOFTKEY_STORAGE_KEY } from "./common";

export class SoftkeyUser extends User {
    public signatureProvider: SignatureProvider | undefined;
    private api: Api | undefined;
    private rpc: JsonRpc | undefined;

    // Default to WAX Testnet
    private chainId =
        "f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12";

    constructor(
        private chain: Chain,
        private accountName: string,
        private loginHook: UALSoftKeyLoginHook
    ) {
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

        await this.updateEncryptionKeyWithSoftKey(privateKey);

        localStorage.setItem(UAL_SOFTKEY_STORAGE_KEY, privateKey);
    }

    private async updateEncryptionKeyWithSoftKey(
        privateKey: string
    ): Promise<void> {
        try {
            const edenMember = await getEdenMember(this.accountName);
            const publicKey = PrivateKey.fromString(privateKey)
                .getPublicKey()
                .toLegacyString();
            if (publicKey === edenMember?.encryption_key) {
                // key already set on account; just set as encryption password in browser
                this.loginHook.updateEncryptionPassword(publicKey, privateKey);
                return;
            }

            const trx = setEncryptionPublicKeyTransaction(
                this.accountName,
                publicKey
            );
            await this.signTransaction(trx);

            this.loginHook.updateEncryptionPassword(publicKey, privateKey);

            console.info(
                "updated the encryption key to the same as the password successfully!"
            );
        } catch (e) {
            console.error("fail to set encryption key", e);
        }
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
