import { useQuery } from "react-query";

import {
    queryEndorsementsByInductionId,
    useMemberListByAccountNames,
} from "_app";

import { Endorsement, Induction } from "../../interfaces";

interface Props {
    induction: Induction;
    skipEndorser?: string;
}

export const EndorsersNames = ({ induction, skipEndorser }: Props) => {
    const { data: endorsements } = useQuery(
        queryEndorsementsByInductionId(induction.id)
    );

    const endorsersAccounts =
        endorsements
            ?.map((endorsement: Endorsement): string => endorsement.endorser)
            .filter((endorser: string) => endorser !== skipEndorser) || [];

    const endorsersMembers = useMemberListByAccountNames(endorsersAccounts);

    const endorsers =
        endorsersMembers
            .map(
                (member, index) => member.data?.name || endorsersAccounts[index]
            )
            .join(", ") || "";

    return <>{endorsers}</>;
};
