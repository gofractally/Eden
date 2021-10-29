import {
    assetToLocaleString,
    Link,
    Text,
    useTokenBalanceForAccount,
} from "_app";
import { blockExplorerAccountBaseUrl } from "config";

interface Props {
    account: string;
}

export const TokenBalance = ({ account }: Props) => {
    const { data: balance } = useTokenBalanceForAccount(account);

    return (
        <div>
            <Text>
                <strong>Balance:</strong>{" "}
                {balance ? assetToLocaleString(balance) : "loading..."}{" "}
                <Link
                    href={`${blockExplorerAccountBaseUrl}/${account}`}
                    target="_blank"
                >
                    History
                </Link>
            </Text>
        </div>
    );
};
