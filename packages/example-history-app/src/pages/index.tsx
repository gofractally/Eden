import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { buildSchema, GraphQLSchema } from "graphql";
import { EdenSubchain } from "@edenos/common/dist/subchain";

function createFetcher(subchain: EdenSubchain) {
    return async ({ query }: { query: string }) => subchain.query(query);
}

function query(cursor: string) {
    return `
    {
      members(first: 5, after: "${cursor}") {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            account
            profile {
              name
              img
              bio
            }
          }
        }
      }
    }`;
}

interface QueryResult {
    data: {
        members: {
            pageInfo: {
                hasNextPage: boolean;
                endCursor: string;
            };
            edges: [
                {
                    node: {
                        account: string;
                        profile: {
                            name: string;
                            img: string;
                            bio: string;
                        };
                    };
                }
            ];
        };
    };
}

export default function Members(props: { subchain?: EdenSubchain }) {
    const [queryResult, setQueryResult] = useState<QueryResult>();

    if (props.subchain && !queryResult)
        setQueryResult(props.subchain.query(query("")));
    return (
        <div>
            <style global jsx>{`
                html,
                body,
                body > div:first-child,
                div#__next,
                div#__next > div {
                    height: 100%;
                    border: 0;
                    margin: 0;
                    padding: 0;
                }
            `}</style>
            <Head>
                <title>Members</title>
            </Head>
            <main style={{ height: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                    }}
                >
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
                    {!queryResult && (
                        <div style={{ flexGrow: 1, margin: "10px" }}>
                            <h1>Loading micro chain...</h1>
                        </div>
                    )}
                    {queryResult && (
                        <div style={{ flexGrow: 1, margin: "10px" }}>
                            <h1>Members</h1>
                            <button
                                disabled={
                                    !queryResult.data.members.pageInfo
                                        .hasNextPage
                                }
                                onClick={(e) =>
                                    setQueryResult(
                                        props.subchain!.query(
                                            query(
                                                queryResult.data.members
                                                    .pageInfo.endCursor
                                            )
                                        )
                                    )
                                }
                            >
                                More
                            </button>
                            {queryResult.data.members.edges.map((edge) => (
                                <table
                                    key={edge.node.account}
                                    style={{ margin: 20, borderStyle: "solid" }}
                                >
                                    <tbody>
                                        <tr>
                                            <td>
                                                <b>Name:</b>
                                            </td>
                                            <td>{edge.node.profile.name}</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>Image:</b>
                                            </td>
                                            <td>{edge.node.profile.img}</td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <b>Bio:</b>
                                            </td>
                                            <td>{edge.node.profile.bio}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
