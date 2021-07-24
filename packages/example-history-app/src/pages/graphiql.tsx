import Head from "next/head";
import Link from "next/link";
import GraphiQL from "graphiql";
import { buildSchema, GraphQLSchema } from "graphql";
import { EdenSubchain } from "@edenos/common/dist/subchain";

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

export default function GraphiQLPage(props: { subchain?: EdenSubchain }) {
    if (props.subchain && !schema)
        schema = buildSchema(props.subchain.getSchema());
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
                    {props.subchain && (
                        <div style={{ flexGrow: 1 }}>
                            <GraphiQL
                                {...{
                                    fetcher: createFetcher(props.subchain),
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
