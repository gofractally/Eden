import { edenContractAccount, rpcEndpoint } from "config";

const RPC_URL = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
const RPC_GET_TABLE_ROWS = `${RPC_URL}/v1/chain/get_table_rows`;

const CONTRACT_SCOPE = "0";
const CONTRACT_MEMBER_TABLE = "member";

export const getEdenMember = async (member: string) => {
    const requestBody = {
        code: edenContractAccount,
        index_position: 1,
        json: true,
        key_type: "",
        limit: "1",
        lower_bound: member,
        reverse: false,
        scope: CONTRACT_SCOPE,
        show_payer: false,
        table: CONTRACT_MEMBER_TABLE,
        table_key: "",
        upper_bound: null,
    };

    const response = await fetch(RPC_GET_TABLE_ROWS, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.info("fetched eden member data", data);

    if (!data || !data.rows) {
        throw new Error("Invalid table results");
    }

    const rows = data.rows as any[];
    return rows.length > 0 && rows[0].member === member ? rows[0] : undefined;
};
