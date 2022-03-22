export const reverseHex = (hexStr: string) => {
    return (
        hexStr.substr(6, 2) +
        hexStr.substr(4, 2) +
        hexStr.substr(2, 2) +
        hexStr.substr(0, 2)
    );
};
