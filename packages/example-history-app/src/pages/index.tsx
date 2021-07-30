import Head from "next/head";
import Header from "../components/header";
import { usePagedQuery } from "../../../common/src/subchain/ReactSubchain";

const query = `
{
  members(@page@) {
    pageInfo {
      hasPreviousPage
      hasNextPage
      startCursor
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

interface QueryResult {
    data?: {
        members: {
            pageInfo: {
                hasPreviousPage: boolean;
                hasNextPage: boolean;
                startCursor: string;
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

export default function Members() {
    const { result, next, previous } = usePagedQuery<QueryResult>(query, 4);
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
                    <Header />
                    {!result && (
                        <div style={{ flexGrow: 1, margin: "10px" }}>
                            <h1>Loading micro chain...</h1>
                        </div>
                    )}
                    {result?.data && (
                        <div style={{ flexGrow: 1, margin: "10px" }}>
                            <h1>Members</h1>

                            <button
                                disabled={
                                    !result.data.members.pageInfo
                                        .hasPreviousPage
                                }
                                onClick={() =>
                                    previous(
                                        result!.data!.members.pageInfo
                                            .startCursor
                                    )
                                }
                            >
                                &lt;
                            </button>

                            <button
                                disabled={
                                    !result.data.members.pageInfo.hasNextPage
                                }
                                onClick={() =>
                                    next(
                                        result!.data!.members.pageInfo.endCursor
                                    )
                                }
                            >
                                &gt;
                            </button>

                            {result.data.members.edges.map((edge) => (
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
