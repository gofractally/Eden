import Link from "next/link";
import { useQuery } from "../../../common/src/subchain/ReactSubchain";

export default function Header() {
    const info = useQuery("{blockLog{head{num eosio_block{num}}}}");
    return (
        <div>
            <div style={{ margin: 10 }}>
                <table>
                    <tbody>
                        <tr>
                            <td>block:</td>
                            <td>{info?.data?.blockLog.head?.num}</td>
                        </tr>
                        <tr>
                            <td>eosio block:</td>
                            <td>
                                {info?.data?.blockLog.head?.eosio_block.num}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <ul>
                <li>
                    <Link href="/">
                        <a>Members</a>
                    </Link>
                </li>
                <li>
                    <Link href="/graphiql">
                        <a>GraphiQL</a>
                    </Link>
                </li>
            </ul>
        </div>
    );
}
