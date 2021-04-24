import { SingleColLayout, useFetchedData, useUALAccount } from "_app";
import { EdenMember, getEdenMember, MemberStatus } from "members";
import { InitInduction } from "inductions";

export const InitInductionPage = () => {
    const [ualAccount] = useUALAccount();
    const [edenMember] = useFetchedData<EdenMember>(
        getEdenMember,
        ualAccount?.accountName
    );

    return (
        <SingleColLayout title="Induction">
            {!ualAccount ? (
                <div>Please login using yout wallet.</div>
            ) : !edenMember ||
              edenMember.status !== MemberStatus.ActiveMember ? (
                <p className="text-red-500">
                    Your account is not active. You cannot initialize any
                    induction.
                </p>
            ) : (
                <InitInduction ualAccount={ualAccount} />
            )}
        </SingleColLayout>
    );
};

export default InitInductionPage;
