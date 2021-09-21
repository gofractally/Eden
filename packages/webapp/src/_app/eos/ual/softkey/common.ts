import { UALError, UALErrorType } from "universal-authenticator-library";

export const AUTHENTICATOR_NAME = "Password";
export const UAL_SOFTKEY_STORAGE_KEY = "ualSoftKey";

export class UALSoftkeyError extends UALError {
    constructor(
        message: string,
        type: UALErrorType,
        cause: Error | null = null
    ) {
        super(message, type, cause, "We");
    }
}
