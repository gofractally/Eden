import { useQuery } from "react-query";

import {
    queryEndorsementsByInductionId,
    useMemberByAccountName,
    useMemberListByAccountNames,
} from "_app";
import { ROUTES } from "_app/config";
import { Text, Link } from "_app/ui";
import { useGetInductionWithEndorsements } from "inductions/hooks";
import { Endorsement, Induction } from "inductions/interfaces";
import { EdenMember } from "members/interfaces";

export const useInductionMembers = (inductionId: string) => {
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

export const InductionNames = ({
    inductionId,
    className,
}: {
    inductionId: string;
    className?: string;
}) => {
    const inductionMembers = useInductionMembers(inductionId);
    const { inviter, endorsers } = inductionMembers;
    return (
        <section className={`space-y-1 ${className}`}>
            {inviter?.name && (
                <Text>
                    <span className="font-medium">Inviter:</span>{" "}
                    <Link href={`${ROUTES.MEMBERS.href}/${inviter.account}`}>
                        {inviter.name}
                    </Link>
                </Text>
            )}
            {endorsers.length && (
                <Text>
                    <span className="font-medium">Witnesses:</span>{" "}
                    {endorsers.map((member, index) => (
                        <span key={`endorser-${member.account}`}>
                            <Link
                                href={`${ROUTES.MEMBERS.href}/${member.account}`}
                            >
                                {member!.name}
                            </Link>
                            {index < endorsers.length - 1 ? ", " : ""}
                        </span>
                    ))}
                </Text>
            )}
        </section>
    );
};

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
