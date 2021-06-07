import { useMemo } from "react";
import { useQuery } from "react-query";

import { useUALAccount } from "_app";

import { getInductionUserRole, getInductionWithEndorsements } from ".";
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

export const GET_INDUCTION_WITH_ENDORSEMENTS_QUERY =
    "induction-with-endorsements";

export const useGetInductionWithEndorsements = (inductionId: string) =>
    useQuery(
        [GET_INDUCTION_WITH_ENDORSEMENTS_QUERY, inductionId],
        () => getInductionWithEndorsements(inductionId),
        {
            // gets rid of bugs cause by refetching right after anchor/scatter signing
            refetchOnWindowFocus: false,
        }
    );
