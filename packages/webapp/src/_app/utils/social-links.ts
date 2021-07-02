export const getTwitterHandle = (
    profileTwitter: string | undefined
): string | undefined => stripLeadingAtSymbol(profileTwitter);

export const isValidTwitterHandle = (
    profileTwitter: string | undefined
): boolean => !startsWithAtSymbol(profileTwitter);

export const getTelegramHandle = (
    profileTelegram: string | undefined
): string | undefined => stripLeadingAtSymbol(profileTelegram);

export const isValidTelegramHandle = (
    profileTelegram: string | undefined
): boolean => !startsWithAtSymbol(profileTelegram);

export const getFacebookHandle = (
    profileFacebook: string | undefined
): string | undefined => getStringAfterTrailingSlash(profileFacebook);

export const isValidFacebookHandle = (
    profileFacebook: string | undefined
): boolean => !containsSlashes(profileFacebook);

export const getLinkedinHandle = (
    profileTelegram: string | undefined
): string | undefined => getStringAfterTrailingSlash(profileTelegram);

export const isValidLinkedinHandle = (
    profileLinkedin: string | undefined
): boolean => !containsSlashes(profileLinkedin);

const startsWithAtSymbol = (str: string | undefined) =>
    str && str.startsWith("@");

export const stripLeadingAtSymbol = (
    str: string | undefined
): string | undefined => (str && startsWithAtSymbol(str) ? str.slice(1) : str);

const containsSlashes = (str: string | undefined) =>
    str && str.indexOf("/") >= 0;

export const getStringAfterTrailingSlash = (
    str: string | undefined
): string | undefined => str && str.slice(str.lastIndexOf("/") + 1);
