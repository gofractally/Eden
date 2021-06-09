import { useQuery } from "react-query";

import { queryEndorsementsByInductionId, useMemberByAccountName } from "_app";

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

    const endorsers = endorsersAccounts.map<React.ReactNode>((account) => (
        <AccountName key={account} account={account} />
    ));

    return (
        <>
            {endorsers.length && // prints account names separated by comma
                endorsers.reduce((prev, curr) => [prev, ", ", curr])}
        </>
    );
};

export const AccountName = ({ account }: { account: string }) => {
    const { data: member } = useMemberByAccountName(account);
    return <>{member?.name || account}</>;
};
