import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/eden-subchain-client/dist/ReactSubchain";

import { atomicAssets, edenContractAccount } from "config";
import { formatQueriedMemberData, MEMBER_DATA_FRAGMENT } from "members";
import { getCollection, memberDataDefaults } from "members/api";
import { MemberData, MembersQueryNode } from "members/interfaces";
import { NFTCollectorsQuery } from "nfts/interfaces";

export const queryMemberNFTCollection = (account: string) => ({
    queryKey: ["query_member_nft_collection", account],
    queryFn: () => getCollection(account),
});

export const useMemberNFTCollection = (account: string) => {
    return useReactQuery<MemberData[]>({
        ...queryMemberNFTCollection(account),
    });
};

export const useMemberNFTCollectors = (account: string) => {
    const result = useBoxQuery<NFTCollectorsQuery>(`{
        members(ge: "${account}", le: "${account}") {
            edges {
                node {
                    nfts {
                        edges {
                            node {
                                owner {
                                    ${MEMBER_DATA_FRAGMENT}
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

// filter new-member and after-market auctions
const isAuction = (account: string) =>
    [edenContractAccount, atomicAssets.marketContract].includes(account);

const formatCollectorAsMemberData = (owner: MembersQueryNode) => {
    if (owner.profile) {
        return formatQueriedMemberData(owner) as MemberData;
    }
    return { ...memberDataDefaults, name: owner.account };
};
