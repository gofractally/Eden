import Head from "next/head";
import Header from "../components/header";
import { Fragment } from "react";
import { usePagedQuery } from "../../../common/src/subchain/ReactSubchain";

const query = `
{
  members(@page@) {
    pageInfo{hasPreviousPage hasNextPage startCursor endCursor}
    edges{node{account}}
  }
}`;

function Members() {
    const { result, first, next, previous, last } = usePagedQuery(query, 10);
    return (
        <Fragment>
            <div>
                <button disabled={!result?.data} onClick={first}>
                    first
                </button>
                <button
                    disabled={!result?.data?.members.pageInfo.hasPreviousPage}
                    onClick={() =>
                        previous(result!.data!.members.pageInfo.startCursor)
                    }
                >
                    prev
                </button>
                <button
                    disabled={!result?.data?.members.pageInfo.hasNextPage}
                    onClick={() =>
                        next(result!.data!.members.pageInfo.endCursor)
                    }
                >
                    next
                </button>
                <button disabled={!result?.data} onClick={last}>
                    last
                </button>
            </div>
            <ul>
                {result?.data?.members.edges.map((edge: any) => (
                    <li key={edge.node.account}>{edge.node.account}</li>
                ))}
            </ul>
        </Fragment>
    );
}

export default function Page() {
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
                    <Members />
                </div>
            </main>
        </div>
    );
}
