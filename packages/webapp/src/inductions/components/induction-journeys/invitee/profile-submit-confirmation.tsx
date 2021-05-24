import { ActionButton, ActionButtonSize, Heading, Text } from "_app";

interface Props {
    isCommunityActive?: boolean;
}

export const InductionProfileSubmitConfirmation = ({
    isCommunityActive,
}: Props) => {
    return (
        <>
            <Heading size={1} className="mb-5">
                Success!
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    Thanks for submitting your profile.
                </Text>
                <Text className="leading-normal">
                    {isCommunityActive
                        ? "Your inviter and witnesses will be in touch to schedule the short video induction ceremony. Now's a good time to reach out to them to let them know you're ready."
                        : "The next step in the induction process is to submit your donation. Once all Genesis members have completed their profiles and donations, the community will be activated."}
                </Text>
            </div>
            <ActionButton
                onClick={() => window.location.reload()}
                size={ActionButtonSize.L}
            >
                {isCommunityActive ? "See induction status" : "Onward!"}
            </ActionButton>
        </>
    );
};
