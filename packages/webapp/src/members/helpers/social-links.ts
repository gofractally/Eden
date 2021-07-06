export const getValidSocialLink = (link: string | undefined) => {
    if (!link) return link;

    if (link.endsWith("/")) link = link.slice(0, link.length - 1);

    if (containsSlashes(link)) link = getStringAfterTrailingSlash(link);

    return stripLeadingAtSymbol(link);
};

const startsWithAtSymbol = (str: string | undefined) =>
    str && str.startsWith("@");

const stripLeadingAtSymbol = (str: string | undefined): string | undefined =>
    str && startsWithAtSymbol(str) ? str.slice(1) : str;

const containsSlashes = (str: string | undefined) =>
    str && str.indexOf("/") >= 0;

const getStringAfterTrailingSlash = (
    str: string | undefined
): string | undefined => str && str.slice(str.lastIndexOf("/") + 1);
