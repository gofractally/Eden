export const stripLeadingAtSymbol = (
    str: string | undefined
): string | undefined => {
    if (str && str.startsWith("@")) {
        return str.slice(1);
    }

    return str;
};

export const getTwitterHandle = (
    profileTwitter: string | undefined
): string | undefined => stripLeadingAtSymbol(profileTwitter);

export const getTelegramHandle = (
    profileTelegram: string | undefined
): string | undefined => stripLeadingAtSymbol(profileTelegram);

export const getStringAfterTrailingSlash = (
    str: string | undefined
): string | undefined => str && str.slice(str.lastIndexOf("/") + 1);

export const getFacebookHandle = (
    profileFacebook: string | undefined
): string | undefined => getStringAfterTrailingSlash(profileFacebook);
export const getLinkedinHandle = (
    profileTelegram: string | undefined
): string | undefined => getStringAfterTrailingSlash(profileTelegram);
