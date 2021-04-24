import { Link, SingleColLayout, useFetchedData, useUALAccount } from "_app";

import { Donation, PendingInductions } from "inductions";
import { getEdenMember, MemberStatus, EdenMember } from "members";

export const InductionPage = () => {
    const [ualAccount] = useUALAccount();
    const [edenMember, isLoading] = useFetchedData<EdenMember>(
        getEdenMember,
        ualAccount?.accountName
    );

    return (
        <SingleColLayout title="Induction">
            {!ualAccount ? (
                <div>Please login using yout wallet.</div>
            ) : isLoading ? (
                <p>Loading...</p>
            ) : edenMember ? (
                <>
                    {edenMember.status === MemberStatus.ActiveMember && (
                        <p className="mb-4">
                            Hello, fellow eden member! Your account is{" "}
                            <strong>active</strong>!
                            <Link href="/induction/init" className="ml-2">
                                Would you like to start an induction ceremony?
                            </Link>
                        </p>
                    )}
                    <PendingInductions />
                </>
            ) : (
                <Donation />
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
