import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/eden-subchain-client/dist/ReactSubchain";

import { atomicAssets, edenContractAccount } from "config";
import {
    formatMembersQueryNodeAsMemberNFT,
    MEMBER_DATA_FRAGMENT,
} from "members";
import { getCollection, memberNFTDefaults } from "members/api";
import { MemberNFT, MembersQueryNode } from "members/interfaces";
import { NFTCollectorsQuery } from "nfts/interfaces";

// NOTE: Eden member NFTs may be deprecated soon.
export const queryMemberNFTCollection = (account: string) => ({
    queryKey: ["query_member_nft_collection", account],
    queryFn: () => getCollection(account),
});

export const useMemberNFTCollection = (account: string) => {
    return useReactQuery<MemberNFT[]>({
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

    let collectors: MemberNFT[] = [];

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
        return formatMembersQueryNodeAsMemberNFT(owner) as MemberNFT;
    }
    return { ...memberNFTDefaults, name: owner.account };
};
