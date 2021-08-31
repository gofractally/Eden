export const openInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
};

export const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
