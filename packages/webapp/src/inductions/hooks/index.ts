import { useMemo } from "react";
import { useUALAccount } from "_app";
import { getInductionUserRole } from "inductions";
import { Endorsement, Induction, InductionRole } from "../interfaces";

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

export * from "./queries";
