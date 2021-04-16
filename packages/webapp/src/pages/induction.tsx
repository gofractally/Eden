import { SingleColLayout, useFetchedData } from "_app";
import { getEdenMember } from "members";
import { useUALAccount } from "_app/ual";
import { Donation } from "members/components/donation";

export const InductionPage = () => {
    const [ualAccount] = useUALAccount();
    const [edenMember] = useFetchedData(getEdenMember, ualAccount?.accountName);

    return (
        <SingleColLayout title="Induction">
            {!ualAccount ? (
                <div>Please login using yout wallet.</div>
            ) : edenMember && edenMember.status === 1 ? (
                <p>Your account is activated! Do you want to invite someone?</p>
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
