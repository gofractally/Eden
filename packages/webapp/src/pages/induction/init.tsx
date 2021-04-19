import { SingleColLayout, useFetchedData, useUALAccount } from "_app";
import { getEdenMember } from "members";
import { InitInduction } from "inductions";

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
