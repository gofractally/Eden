import { useRouter } from "next/router";
import { usePagedQuery } from "@edenos/common/dist/subchain";
import { Container, SideNavLayout, Heading } from "_app";

export const AsPage = () => {
    const router = useRouter();

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
            }
          }
        }
      }
    }`;

    const pagedResult = usePagedQuery(
        query,
        20,
        (result) => result.data?.members.pageInfo
    );

    return (
        <SideNavLayout title="Community">
            <Container>
                <Heading size={1}>Community</Heading>
            </Container>

            <Container>
                <Heading size={2}>All members</Heading>
                {pagedResult.result.isLoading && "Loading members..."}
                {pagedResult.result.isError && "Fail to load members"}
            </Container>

            <div style={{ padding: 12 }}>
                <div>
                    <button
                        style={{
                            borderWidth: 2,
                            borderColor: "black",
                            margin: 4,
                            padding: 4,
                        }}
                        disabled={!pagedResult.result}
                        onClick={pagedResult.first}
                    >
                        first
                    </button>
                    <button
                        style={{
                            borderWidth: 2,
                            borderColor: "black",
                            margin: 4,
                            padding: 4,
                        }}
                        disabled={!pagedResult.hasPreviousPage}
                        onClick={pagedResult.previous}
                    >
                        prev
                    </button>
                    <button
                        style={{
                            borderWidth: 2,
                            borderColor: "black",
                            margin: 4,
                            padding: 4,
                        }}
                        disabled={!pagedResult.hasNextPage}
                        onClick={pagedResult.next}
                    >
                        next
                    </button>
                    <button
                        style={{
                            borderWidth: 2,
                            borderColor: "black",
                            margin: 4,
                            padding: 4,
                        }}
                        disabled={!pagedResult.result}
                        onClick={pagedResult.last}
                    >
                        last
                    </button>
                </div>
                <table style={{ margin: 4 }}>
                    <tbody>
                        {pagedResult.result?.data?.members.edges.map(
                            (edge: any) => {
                                const onClick = (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    router.push(`/as/${edge.node.account}`);
                                };
                                return (
                                    <tr
                                        key={edge.node.account}
                                        style={{ height: 35 }}
                                    >
                                        <td onClick={onClick}>
                                            {edge.node.account}
                                        </td>
                                        <td onClick={onClick}>
                                            {edge.node.profile.name}
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>
        </SideNavLayout>
    );
};

export default AsPage;
