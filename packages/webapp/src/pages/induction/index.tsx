import { SingleColLayout, useFetchedData, useUALAccount } from "_app";

import { Donation } from "inductions";
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
            ) : edenMember &&
              edenMember.status === MemberStatus.ActiveMember ? (
                <p>Your account is activated! Do you want to invite someone?</p>
            ) : isLoading ? (
                <p>Loading...</p>
            ) : (
                <Donation
                    ualAccount={ualAccount}
                    alreadyDonated={Boolean(edenMember)}
                />
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
