import {
    Authenticator,
    UALError,
    UALErrorType,
    User,
} from "universal-authenticator-library";
import {
    UALSoftkeyError,
    UAL_SOFTKEY_STORAGE_KEY,
} from "./common";

import { SoftkeyUser } from "./softkey-user";

export class SoftkeyAuthenticator extends Authenticator {
    private users: SoftkeyUser[] = [];
    private readonly supportedChains = {
        // SoftkeyAuthenticator only supports WAX Testnet and Ephemeral Chain
        f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12: {},
        953486e83a647009b04587879db89dee61f960b894c5df847b4d454575443d73: {},
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
            icon: "/images/eden-logo-penta.svg",
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
            throw new UALSoftkeyError(
                "No password provided.",
                UALErrorType.Login
            );
        }
        for (const chain of this.chains) {
            const user = new SoftkeyUser(chain, accountName, this.loginHook);
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
