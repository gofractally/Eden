import { Heading, Text } from "_app";
import { getInductionRemainingTimeDays } from "inductions";
import { Induction } from "inductions/interfaces";

export const WaitingForVideo = ({ induction }: { induction: Induction }) => {
    return (
        <>
            <Heading size={1} className="mb-5">
                Pending induction ceremony
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    Your inviter or one of the witnesses will be in touch with
                    you to schedule a short, recorded video induction ceremony.
                </Text>
                <Text className="leading-normal">
                    If you've already completed the ceremony, ask your inviter
                    or a witness to attach the video recording here.
                </Text>
                <Text className="leading-normal">
                    <span className="font-medium">
                        Remember, this invitation is still open and expires in{" "}
                        {getInductionRemainingTimeDays(induction)}.
                    </span>{" "}
                    If time runs out, you can always request another invitation.
                </Text>
                <Text className="leading-normal">
                    In the meantime, review your Eden profile below.
                </Text>
            </div>
        </>
    );
};
