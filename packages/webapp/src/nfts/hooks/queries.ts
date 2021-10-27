import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/common/dist/subchain";

import { atomicAssets, edenContractAccount } from "config";
import { formatQueriedMemberData, MembersQueryNode } from "members";
import { getCollection, memberDataDefaults } from "members/api";
import { MemberData } from "members/interfaces";

export const queryMemberNFTCollection = (account: string) => ({
    queryKey: ["query_member_nft_collection", account],
    queryFn: () => getCollection(account),
});

export const useMemberNFTCollection = (account: string) => {
    return useReactQuery<MemberData[]>({
        ...queryMemberNFTCollection(account),
    });
};

interface NFTCollectorsQueryNode {
    owner: MembersQueryNode;
}

interface NFTCollectorsQuery {
    members: {
        edges: {
            node: {
                nfts: {
                    edges: {
                        node: NFTCollectorsQueryNode;
                    }[];
                };
            };
        }[];
    };
}

export const useMemberNFTCollectors = (account: string) => {
    const result = useBoxQuery<NFTCollectorsQuery>(`{
        members(ge: "${account}", le: "${account}") {
            edges {
                node {
                    nfts {
                        edges {
                            node {
                                owner {
                                    account
                                    createdAt
                                    profile {
                                        name
                                        img
                                        attributions
                                        social
                                        bio
                                    }
                                    inductionVideo
                                }
                            }
                        }
                    }
                }
            }
        }
    }`);

    let collectors: MemberData[] = [];

    if (!result.data) return { ...result, data: collectors };

    const collectorEdges = result.data.members.edges[0]?.node.nfts.edges;
    if (collectorEdges) {
        collectors = collectorEdges
            .filter((edge) => !isAuction(edge.node.owner.account))
            .map((edge) => formatCollectorAsMemberData(edge.node.owner));
    }

    return { ...result, data: collectors };
};

// filter out failed new-member auctions and ongoing after-market auctions
const isAuction = (account: string) =>
    [edenContractAccount, atomicAssets.marketContract].includes(account);

const formatCollectorAsMemberData = (owner: MembersQueryNode) => {
    if (owner.profile) {
        return formatQueriedMemberData(owner) as MemberData;
    }
    return { ...memberDataDefaults, name: owner.account };
};
