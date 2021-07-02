import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { useQueryClient } from "react-query";
import { RiVideoUploadFill } from "react-icons/ri";
import { FaPlayCircle } from "react-icons/fa";

import {
    Button,
    Form,
    Heading,
    ipfsUrl,
    onError,
    queryInductionWithEndorsements,
    Text,
    useUALAccount,
} from "_app";
import { submitEndorsementTransaction } from "inductions";
import { Induction } from "inductions/interfaces";

interface Props {
    induction: Induction;
    setIsRevisitingVideo: Dispatch<SetStateAction<boolean>>;
}

export const InductionEndorsementForm = ({
    induction,
    setIsRevisitingVideo,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const queryClient = useQueryClient();
    const [isLoading, setLoading] = useState(false);

    const submitEndorsement = async (e: FormEvent) => {
        e.preventDefault();
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

            // tolerance time to make sure blockchain processed the transactions
            await new Promise((resolve) => setTimeout(resolve, 6000));

            // refetch induction/endorsements to update endorsements list or go to pending donate screen
            queryClient.invalidateQueries(
                queryInductionWithEndorsements(induction.id).queryKey
            );
        } catch (error) {
            onError(error, "Unable to submit endorsement");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submitEndorsement} className="mt-4 space-y-4">
            <section id="profile-review" className="space-y-2">
                <div className="mt-4 space-y-3">
                    <Heading size={2} className="mb-2">
                        Review profile
                    </Heading>
                    <Text>
                        Carefully review the prospective member's profile below
                        as per the following check boxes. If anything needs to
                        be corrected, ask the invitee to sign in and make the
                        required corrections.
                    </Text>
                </div>
                <div className="p-3 border rounded">
                    <Form.Checkbox
                        id="photo"
                        label="The person in the profile photo below is the same person who appeared in the induction ceremony video call. Their face is clearly visible in the image (no mask, sunglasses, etc.)"
                        disabled={isLoading}
                        required
                    />
                </div>
                <div className="p-3 border rounded">
                    <Form.Checkbox
                        id="links"
                        label="I have visited each social link below and affirm that all links are working properly and appear to belong to the invitee."
                        disabled={isLoading}
                        required
                    />
                </div>
            </section>
            <section id="video-review" className="space-y-2">
                <Heading size={2} className="mb-2">
                    Review video
                </Heading>
                <div className="flex flex-col items-center p-3 border rounded space-y-2">
                    <Form.Checkbox
                        id="video"
                        label="The correct induction ceremony video is attached and participants are visible in the video."
                        disabled={isLoading}
                        required
                    />
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row">
                        <Button
                            type="link"
                            href={ipfsUrl(induction.video)}
                            target="_blank"
                        >
                            <FaPlayCircle className="mr-2" />
                            Review video
                        </Button>
                        <Button
                            type="link"
                            onClick={() => setIsRevisitingVideo(true)}
                        >
                            <RiVideoUploadFill className="mr-2" />
                            Replace video
                        </Button>
                    </div>
                </div>
            </section>
            <section id="make-endorsement" className="space-y-2">
                <Heading size={2} className="">
                    Endorse
                </Heading>
                <div className="flex flex-col space-y-2 items-center md:flex-row md:space-y-0 lg:flex-col lg:space-y-2 xl:flex-row xl:space-y-0 p-3 border rounded space-x-2">
                    <Form.Checkbox
                        id="reviewed"
                        label="I hereby endorse this individual for membership in the Eden community."
                        disabled={isLoading}
                        required
                    />
                    <Button disabled={isLoading} isLoading={isLoading} isSubmit>
                        {isLoading ? "Submitting..." : "Endorse"}
                    </Button>
                </div>
            </section>
        </form>
    );
};
