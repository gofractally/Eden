import {
    ActionButton,
    ActionButtonType,
    ActionButtonSize,
    Text,
    Heading,
} from "_app";

import { Endorsement, Induction } from "../interfaces";
import {
    EndorserInductions,
    InviteeInductions,
    InviterInductions,
} from "./induction-lists";

interface Props {
    inductions: Induction[];
    endorsements: Endorsement[];
    isActive?: boolean;
}

export const PendingInductions = ({
    inductions,
    endorsements,
    isActive,
}: Props) => {
    const thereAreEndorsements = endorsements.length > 0;
    const thereAreInductions = inductions.length > 0;

    if (isActive) {
        return (
            <>
                {(thereAreInductions || thereAreEndorsements) && (
                    <InviteBanner />
                )}
                <div className="space-y-4">
                    {thereAreInductions && (
                        <InviterInductions inductions={inductions} />
                    )}
                    {thereAreEndorsements && (
                        <EndorserInductions endorsements={endorsements} />
                    )}
                </div>
            </>
        );
    } else if (thereAreInductions) {
        return (
            <div className="space-y-4">
                <InviteeInductions inductions={inductions} />
            </div>
        );
    }

    // TODO: After changeover to donation-at-end, do we ever hit this? If not, remove. If so, move out of this component.
    return (
        <div className="space-y-4">
            <Heading size={2}>Join the Eden Community</Heading>
            <Text>
                It looks like you're not an Eden member yet. To get started, get
                an invitation from someone already in the community using your
                EOS account name. As soon as an active Eden community member
                invites you, their invitation will appear below and will guide
                you through the process.
            </Text>
            <Text>
                [Graphic and/or link explaining the process in more detail.]
            </Text>
        </div>
    );
};

const InviteBanner = () => (
    <div className="flex items-center justify-center text-center flex-col md:flex-row-reverse md:justify-start mt-4 mb-6">
        <div className="w-44 md:w-56 sm:mx-0 md:mx-4">
            <ActionButton
                href="/induction/init"
                type={ActionButtonType.DEFAULT}
                size={ActionButtonSize.S}
                fullWidth
            >
                Invite to Eden
            </ActionButton>
        </div>
        <div className="text-sm text-gray-700 w-3/4 md:w-auto mt-2 md:mt-0">
            Invite your trusted contacts in the EOS community to Eden.
        </div>
    </div>
);
