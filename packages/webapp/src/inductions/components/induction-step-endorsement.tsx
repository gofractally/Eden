import { useState } from "react";
import { useRouter } from "next/router";

import { Button, Form, Heading, Text, useUALAccount } from "_app";
import { Induction } from "../interfaces";
import { submitEndorsementTransaction } from "../transactions";
import { NewMemberCardPreview } from "./new-member-card-preview";
import { convertPendingProfileToMemberData } from "../utils";

interface Props {
    induction: Induction;
}

export const InductionStepEndorsement = (props: Props) => {
    const router = useRouter();
    const [ualAccount] = useUALAccount();
    const [induction, setInduction] = useState({ ...props.induction });
    const [isReviewed, setReviewed] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const submitEndorsement = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = submitEndorsementTransaction(
                authorizerAccount,
                induction
            );
            console.info(transaction);

            setLoading(true);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductendors trx", signedTrx);

            await updateEndorsements();
        } catch (error) {
            console.error(error);
            alert(
                "Error while initializing the induction process: " +
                    JSON.stringify(error)
            );
        }

        setLoading(false);
    };

    const updateEndorsements = async () => {
        // check if it's the last endorsement
        const totalEndorsers = induction.witnesses.length + 1;
        if (induction.endorsements.length === totalEndorsers - 1) {
            // router go to the newly created member page after some tolerance interval
            await new Promise((resolve) => setTimeout(resolve, 4000));
            router.push(`/members/${induction.invitee}`);
            return;
        }

        // update the current endorsers list
        setInduction({
            ...induction,
            endorsements: [...induction.endorsements, ualAccount.accountName],
        });
    };

    const memberData = convertPendingProfileToMemberData(induction);

    const isPendingEndorser = () =>
        (ualAccount?.accountName === induction.inviter ||
            induction.witnesses.indexOf(ualAccount?.accountName) >= 0) &&
        induction.endorsements.indexOf(ualAccount?.accountName) < 0;

    const getEndorserStatus = (endorser: string) =>
        induction.endorsements.indexOf(endorser) >= 0 ? (
            <span title="Endorsement Submitted" className="mr-2">
                ✅
            </span>
        ) : (
            <span title="Pending Endorsement" className="mr-2">
                🟡
            </span>
        );

    return (
        <>
            <div className="text-lg mb-4 text-gray-900">
                Step 3/3: Waiting for Endorsements
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-full">
                <div>
                    <Heading size={3} className="mb-2">
                        Endorsers
                    </Heading>
                    <ul className="mb-4">
                        {[induction.inviter, ...induction.witnesses].map(
                            (endorser) => (
                                <li key={endorser}>
                                    {getEndorserStatus(endorser)} {endorser}
                                </li>
                            )
                        )}
                    </ul>
                    {isPendingEndorser() ? (
                        <div className="space-y-3">
                            <Text className="text-red-500">
                                Please review carefully the new member card
                                preview. Make sure that all the social handles
                                links are working. Once all the endorsements are
                                submitted the new Eden Member Induction will be
                                completed and the NFT data will be immutable.
                            </Text>
                            <Text>
                                If any of the new member data is incorrect, ask
                                for the new member to fix his/her profile. If
                                the induction video seems wrong, please reupload
                                the induction video.
                            </Text>
                            <Form.Checkbox
                                id="reviewed"
                                label="I carefully reviewed the New Member data and confirm my endorsement"
                                value={Number(isReviewed)}
                                onChange={() => setReviewed(!isReviewed)}
                            />
                            <div className="w-max mx-auto">
                                <Button
                                    onClick={submitEndorsement}
                                    disabled={isLoading || !isReviewed}
                                >
                                    {isLoading
                                        ? "Submitting endorsement..."
                                        : "Submit"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            Waiting for all the endorsements to complete the
                            induction process.
                        </div>
                    )}
                </div>
                <div>
                    <Heading size={3}>New Member Card Preview</Heading>
                    <NewMemberCardPreview member={memberData} />
                </div>
            </div>
        </>
    );
};
