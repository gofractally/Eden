import {
    assetToLocaleString,
    Link,
    Text,
    useTokenBalanceForAccount,
} from "_app";
import { blockExplorerAccountBaseUrl } from "config";

import { MemberAccountData, MemberData } from "../interfaces";

interface Props {
    member: MemberData | MemberAccountData;
}

export const TokenBalance = ({ member }: Props) => {
    const { data: balance } = useTokenBalanceForAccount(member.account);

    return (
        <div>
            <Text>
                <strong>Balance:</strong>{" "}
                {balance ? assetToLocaleString(balance) : "loading..."}{" "}
                <Link
                    href={`${blockExplorerAccountBaseUrl}/${member.account}`}
                    target="_blank"
                >
                    History
                </Link>
            </Text>
        </div>
    );
};
