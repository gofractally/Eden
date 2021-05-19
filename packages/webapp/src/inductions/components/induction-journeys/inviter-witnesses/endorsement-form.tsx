import React, { Dispatch, SetStateAction, useState } from "react";
import { onError, ActionButton, Form, Link, Text, useUALAccount } from "_app";
import { submitEndorsementTransaction } from "inductions";
import { Endorsement, Induction } from "inductions/interfaces";

interface Props {
    endorsements: Endorsement[];
    induction: Induction;
    setIsReviewingVideo: Dispatch<SetStateAction<boolean>>;
}

export const InviterWitnessEndorsementForm = ({
    induction,
    setIsReviewingVideo,
    ...props
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [isReviewed, setReviewed] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [endorsements, setEndorsements] = useState([...props.endorsements]);

    const updateEndorsements = () => {
        // update the current endorsers list
        const updatedEndorsements = endorsements.map((endorsement) =>
            endorsement.endorser === ualAccount.accountName
                ? { ...endorsement, endorsed: 1 }
                : endorsement
        );
        setEndorsements(updatedEndorsements);
    };

    const submitEndorsement = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = await submitEndorsementTransaction(
                authorizerAccount,
                induction
            );
            console.info(transaction);

            setLoading(true);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductendors trx", signedTrx);

            updateEndorsements();
        } catch (error) {
            onError(error, "Unable to submit endorsement");
        }

        setLoading(false);
    };

    return (
        <div className="space-y-3">
            <Text>
                <span className="underline font-medium">Carefully review</span>{" "}
                the prospective member profile information below. Make sure that
                all social handles and links are accurate and working. If
                anything needs to be corrected, ask the invitee to sign in and
                make the corrections.
            </Text>
            <Text>
                If the induction video needs to be corrected,{" "}
                <Link onClick={() => setIsReviewingVideo(true)}>
                    click here
                </Link>
                . Keep in mind that modifying the induction video will reset any
                endorsements.
            </Text>
            <div className="flex items-end xl:items-center flex-col xl:flex-row p-3 border rounded-md">
                <Form.Checkbox
                    id="reviewed"
                    label="I have carefully reviewed the prospective member's profile information below and affirm my endorsement"
                    value={Number(isReviewed)}
                    onChange={() => setReviewed(!isReviewed)}
                />
                <div className="pt-1 justify-end">
                    <ActionButton
                        disabled={isLoading || !isReviewed}
                        onClick={submitEndorsement}
                    >
                        {isLoading ? "Submitting endorsement..." : "Submit"}
                    </ActionButton>
                </div>
            </div>
        </div>
    );
};
