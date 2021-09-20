import { useMemo } from "react";
import { useQuery } from "react-query";

import {
    queryInductionWithEndorsements,
    useMemberByAccountName,
    useMemberListByAccountNames,
    useUALAccount,
} from "_app";

import { getInductionUserRole } from ".";
import { EdenMember } from "members/interfaces";
import { Endorsement, Induction, InductionRole } from "./interfaces";

export const useInductionUserRole = (
    endorsements: Endorsement[],
    induction?: Induction
): InductionRole => {
    const [ualAccount] = useUALAccount();
    const userRole: InductionRole = useMemo(
        () => getInductionUserRole(endorsements, ualAccount, induction),
        [ualAccount, induction, endorsements]
    );
    return userRole;
};

export const useGetInductionWithEndorsements = (inductionId: string) =>
    useQuery({
        ...queryInductionWithEndorsements(inductionId),
        // gets rid of bugs cause by refetching right after anchor/scatter signing
        refetchOnWindowFocus: false,
    });

export const useInductionParticipants = (inductionId: string) => {
    // This query is often already initialized in the contexts from which we
    // invoke this hook, so we save fetches by relying on this query hook here
    // and reduce prop drilling.
    const { data } = useGetInductionWithEndorsements(inductionId);

    const { data: inviter } = useMemberByAccountName(data?.induction.inviter);
    const { data: invitee } = useMemberByAccountName(data?.induction.invitee);

    const endorserAccounts = data?.endorsements
        ?.map((endorsement: Endorsement): string => endorsement.endorser)
        .filter((endorser: string) => endorser !== data?.induction.inviter);

    const endorsersData = useMemberListByAccountNames(endorserAccounts ?? []);
    const endorsers = endorsersData
        .map((query) => query.data)
        .filter(Boolean) as EdenMember[];

    return {
        inviter,
        invitee,
        endorsers,
    };
};
