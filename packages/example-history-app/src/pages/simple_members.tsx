import Head from "next/head";
import Header from "../components/header";
import { Fragment } from "react";
import { usePagedQuery } from "@edenos/common/dist/subchain";

const query = `
{
  members(@page@) {
    pageInfo{hasPreviousPage hasNextPage startCursor endCursor}
    edges{node{account}}
  }
}`;

function Members() {
    const pagedResult = usePagedQuery(
        query,
        10,
        (result) => result?.data?.members.pageInfo
    );
    return (
        <Fragment>
            <div>
                <button
                    disabled={!pagedResult.result}
                    onClick={pagedResult.first}
                >
                    first
                </button>
                <button
                    disabled={!pagedResult.hasPreviousPage}
                    onClick={pagedResult.previous}
                >
                    prev
                </button>
                <button
                    disabled={!pagedResult.hasNextPage}
                    onClick={pagedResult.next}
                >
                    next
                </button>
                <button
                    disabled={!pagedResult.result}
                    onClick={pagedResult.last}
                >
                    last
                </button>
            </div>
            <ul>
                {pagedResult.result?.data?.members.edges.map((edge: any) => (
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
