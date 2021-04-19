import { useState } from "react";

import { Button, Text } from "_app";
import { minimumDonationAmount } from "config";
import { donationTransaction } from "../transactions";
import { assetToString } from "_app";

interface Props {
    ualAccount: any;
    alreadyDonated: boolean;
}

export const Donation = ({ ualAccount, alreadyDonated }: Props) => {
    const [justDonated, setDonated] = useState(false);
    const donate = async () => {
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = donationTransaction(authorizerAccount);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("donation trx", signedTrx);
            setDonated(true);
        } catch (error) {
            alert("Error while donating: " + JSON.stringify(error));
        }
    };

    return (
        <div className="space-y-3">
            {justDonated || alreadyDonated ? (
                <>
                    <Text className="text-green-600 font-bold mb-4">
                        Thanks for donating to the Eden Community! You are
                        helping with our growth!
                    </Text>
                    {justDonated ? (
                        <Text>
                            The next step is to reach out to your inviter! Then
                            you will get the induction link to be able to
                            complete your induction process.
                        </Text>
                    ) : (
                        <Text>
                            Have you already reached out to your inviter? He/she
                            will provide you the induction link.
                        </Text>
                    )}
                </>
            ) : (
                <>
                    <Text>
                        It seems that your account is not part of the Eden
                        community yet. The first step is to donate the minimum
                        amount to be accepted in the community.
                    </Text>
                    <Text>
                        Make sure you are connected in the EOS community
                        relevant channels because after donating you will need
                        an invitation from an active member.
                    </Text>
                    <Text>
                        If you want to proceed, click on the below button to
                        donate!
                    </Text>
                    <div className="w-max mx-auto">
                        <Button onClick={donate}>
                            I want to Donate{" "}
                            {assetToString(minimumDonationAmount)}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};
