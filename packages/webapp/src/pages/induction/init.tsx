import { SingleColLayout, useFetchedData } from "_app";
import { getEdenMember, MemberStatus } from "members";
import { useUALAccount } from "_app/ual";
import { InitInduction } from "members";

export const InitInductionPage = () => {
    const [ualAccount] = useUALAccount();
    const [edenMember] = useFetchedData(getEdenMember, ualAccount?.accountName);

    return (
        <SingleColLayout title="Induction">
            {!ualAccount ? (
                <div>Please login using yout wallet.</div>
            ) : (
                // TODO: enable
                // ) : !edenMember ||
                //   edenMember.status !== MemberStatus.ActiveMember ? (
                //     <p>
                //         Your account is not activated. You cannot initialize any
                //         induction.
                //     </p>
                <InitInduction ualAccount={ualAccount} />
            )}
        </SingleColLayout>
    );
};

export default InitInductionPage;
