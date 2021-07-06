export const getValidSocialLink = (link: string | undefined) => {
    if (!link) return link;

    if (link.endsWith("/")) link = link.slice(0, link.length - 1);

    if (link.includes("/")) link = getStringAfterTrailingSlash(link);

    return stripLeadingAtSymbol(link);
};

const stripLeadingAtSymbol = (str: string | undefined): string | undefined =>
    str && str.startsWith("@") ? str.slice(1) : str;

const getStringAfterTrailingSlash = (
    str: string | undefined
): string | undefined => str && str.slice(str.lastIndexOf("/") + 1);
