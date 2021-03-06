import { Button } from "_app";
import { InductionStepsContainer, InductionStepInvitee } from "inductions";

export const GetAnInviteCTA = () => {
    return (
        <InductionStepsContainer step={InductionStepInvitee.GetInvite}>
            <>
                <p className="mb-10 text-2xl font-medium title-font text-gray-900">
                    Ready to join Eden? The membership process begins with an
                    invitation. Reach out to a current member to get yours!
                    We'll guide you through the rest.
                </p>
                <Button
                    href="https://www.notion.so/edenos/Getting-an-Invite-2d38947d5be94dcb84dfa1ae48894802"
                    size="lg"
                    target="_blank"
                    isExternal
                >
                    Learn more
                </Button>
            </>
        </InductionStepsContainer>
    );
};
