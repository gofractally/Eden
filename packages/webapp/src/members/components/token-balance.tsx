import { assetToString, Link, Text, useTokenBalanceForAccount } from "_app";
import { blockExplorerAccountBaseUrl } from "config";

import { MemberData } from "../interfaces";

interface Props {
    member: MemberData;
}

export const TokenBalance = ({ member }: Props) => {
    const { data: balance } = useTokenBalanceForAccount(member.account);

    return (
        <div>
            <Text>
                <strong>Balance:</strong>{" "}
                {balance ? assetToString(balance) : "loading..."}{" "}
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
