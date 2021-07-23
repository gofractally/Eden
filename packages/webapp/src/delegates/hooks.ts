import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "react-query";

import {
    queryHeadDelegate,
    queryMemberByAccountName,
    useCurrentMember,
} from "_app";
import { EdenMember } from "members";
import { memberHasRepresentative } from "./api";

export const useHeadDelegate = () => useQuery(queryHeadDelegate);

export const useMyDelegation = () => {
    const [delegates, setDelegates] = useState<EdenMember[]>([]);
    const queryClient = useQueryClient();
    const { data: loggedInMember } = useCurrentMember();
    const { data: leadRepresentative } = useHeadDelegate();

    useEffect(() => {
        if (!loggedInMember || !leadRepresentative) return;
        let nextDelegate = loggedInMember; // should we mutate loggedInMember?
        const myDelegates: EdenMember[] = [];
        (async () => {
            while (
                nextDelegate.account !== leadRepresentative &&
                memberHasRepresentative(nextDelegate)
            ) {
                myDelegates.push(nextDelegate);
                const { queryKey, queryFn } = queryMemberByAccountName(
                    nextDelegate!.representative
                );
                nextDelegate = await queryClient.fetchQuery(queryKey, queryFn); // TODO: try...catch
                if (!nextDelegate) {
                    setDelegates(myDelegates);
                    return;
                }
            }

            if (
                nextDelegate.account === leadRepresentative &&
                memberHasRepresentative(nextDelegate)
            ) {
                myDelegates.push(nextDelegate);
                setDelegates(myDelegates);
            }
        })();
    }, [loggedInMember, leadRepresentative]);

    return delegates;
};
