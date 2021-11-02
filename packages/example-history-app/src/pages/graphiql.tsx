import Head from "next/head";
import GraphiQL from "graphiql";
import Header from "../components/header";
import { buildSchema, GraphQLSchema } from "graphql";
import { useContext } from "react";
import { EdenChainContext } from "@edenos/eden-subchain-client/dist/ReactSubchain";
import { EdenSubchain } from "@edenos/eden-subchain-client/dist/EdenSubchain";

function createFetcher(subchain: EdenSubchain) {
    return async ({ query }: { query: string }) => subchain.query(query);
}

const defaultQuery = `# GraphiQL is talking to a WASM running in the browser.
# The WASM is preloaded with state which includes a subset
# of blocks on the EOS blockchain with actions related to
# the genesis.eden contract.

{
  members(first: 3, after: "30A95491D3189537") {
    edges {
      cursor
      node {
        account
        inviter
        profile {
          name
          img
          bio
        }
      }
    }
  }
}`;

let schema: GraphQLSchema | null = null;

export default function GraphiQLPage() {
    const client = useContext(EdenChainContext);
    if (client?.subchain && !schema)
        schema = buildSchema(client.subchain.getSchema());
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
                <title>GraphiQL</title>
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
                    {client?.subchain && (
                        <div style={{ flexGrow: 1 }}>
                            <GraphiQL
                                {...{
                                    fetcher: createFetcher(client.subchain),
                                    defaultQuery,
                                    schema: schema!,
                                }}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
