import React from "react";
import { ActionButton, ActionButtonSize, Heading, Text } from "_app";

export const InductionVideoSubmitConfirmation = () => {
    return (
        <>
            <Heading size={1} className="mb-5">
                Received!
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    You attached the induction video.
                </Text>
                <Text className="leading-normal">
                    It's time for all witnesses (including the inviter) to
                    endorse the prospective member. Now's a good time to reach
                    out to the other witnesses to let them know that the invitee
                    is waiting for their endorsement.
                </Text>
            </div>
            <ActionButton
                onClick={() => window.location.reload()}
                size={ActionButtonSize.L}
            >
                Onward!
            </ActionButton>
        </>
    );
};
