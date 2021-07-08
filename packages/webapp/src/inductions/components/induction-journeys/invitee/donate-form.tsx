import { useState } from "react";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

import { minimumDonationAmount } from "config";
import {
    Button,
    Text,
    Link,
    Form,
    assetToString,
    useUALAccount,
    onError,
    queryMemberByAccountName,
    URL_PATHS,
} from "_app";

import { donateAndCompleteInductionTransaction } from "inductions";
import { Induction } from "inductions/interfaces";

interface Props {
    induction: Induction;
    isCommunityActive?: boolean;
    setIsRevisitingProfile: (isRevisiting: boolean) => void;
}

export const InductionDonateForm = ({
    induction,
    isCommunityActive,
    setIsRevisitingProfile,
}: Props) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();
    const [isProfileReviewed, setReviewedProfile] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const submitDonation = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = donateAndCompleteInductionTransaction(
                authorizerAccount,
                induction
            );
            console.info(transaction);

            setLoading(true);
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("donation trx", signedTrx);

            // tolerance time to make sure blockchain processed the transactions
            await new Promise((resolve) => setTimeout(resolve, 6000));

            // invalidate ["member", accountName] query so it will refetch with their full name
            queryClient.invalidateQueries(
                queryMemberByAccountName(authorizerAccount).queryKey
            );

            // router goes to the newly created member page
            router.push(`${URL_PATHS.MEMBERS.href}/${induction.invitee}`);
            return;
        } catch (error) {
            onError(
                error,
                "Unable to donate and complete the induction process"
            );
        }

        setLoading(false);
    };

    return (
        <div className="space-y-3">
            <Text>
                This is your last chance to review your profile below for
                completeness and accuracy. If anything needs to be corrected,{" "}
                <Link onClick={() => setIsRevisitingProfile(true)}>
                    click here
                </Link>
                .
                {isCommunityActive &&
                    " Keep in mind that modifying your profile will require your endorsers to submit their endorsements again."}
            </Text>
            <Text>
                If everything looks good, submit your donation to proceed.
                {isCommunityActive &&
                    " Once completed, your membership will be activated and your Eden NFTs will be minted and distributed."}
            </Text>
            <div className="p-3 border rounded-md">
                <Form.Checkbox
                    id="reviewed"
                    label="I have carefully reviewed my profile image, links and information below and confirm their accuracy. I understand that by submitting my donation, my Eden NFTs will be minted and changes to my profile or this NFT series will not be possible."
                    value={Number(isProfileReviewed)}
                    onChange={() => setReviewedProfile(!isProfileReviewed)}
                />
            </div>
            <div className="pt-1">
                <Button
                    disabled={isLoading || !isProfileReviewed}
                    onClick={submitDonation}
                    isLoading={isLoading}
                >
                    {isLoading
                        ? "Submitting donation..."
                        : `Donate ${assetToString(minimumDonationAmount)}`}
                </Button>
            </div>
        </div>
    );
};
