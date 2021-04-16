import { SingleColLayout, useFetchedData } from "_app";
import { getEdenMember } from "members";
import { useUALAccount } from "_app/ual";

export const InductionPage = () => {
    const [ualAccount] = useUALAccount();
    const [edenMember] = useFetchedData(getEdenMember, ualAccount?.accountName);
    console.info(edenMember);

    return (
        <SingleColLayout title="Induction">
            {edenMember && edenMember.status === 1 ? (
                <p>Your account is activated! Do you want to invite someon?</p>
            ) : edenMember && edenMember.status === 0 ? (
                <p>Your account is pending of activation.</p>
            ) : (
                <p>Please donate!</p>
            )}
        </SingleColLayout>
    );
};

export default InductionPage;
