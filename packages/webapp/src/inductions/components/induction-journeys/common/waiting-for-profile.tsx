import { Button, Heading, Link, Text } from "_app";
import { ROUTES } from "_app/routes";

import { getInductionRemainingTimeDays, InductionNames } from "inductions";
import { Induction } from "inductions/interfaces";

export const WaitingForProfile = ({ induction }: { induction: Induction }) => {
    return (
        <>
            <Heading size={1} className="mb-5">
                Waiting for invitee
            </Heading>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    We're waiting on{" "}
                    <span className="font-semibold">{induction.invitee}</span>{" "}
                    to set up their Eden profile.
                </Text>
                <Text className="leading-normal">
                    Encourage the invitee to sign into the Membership dashboard
                    with their blockchain account to complete their profile. Or
                    you can share this direct link with them:
                </Text>
                <Text className="leading-normal break-all">
                    <Link href={window.location.href}>
                        {window.location.href}
                    </Link>
                </Text>
                <Text className="leading-normal font-medium">
                    This invitation expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </Text>
                <InductionNames inductionId={induction.id} />
            </div>
            <Button href={ROUTES.INDUCTION.href} size="lg">
                Membership dashboard
            </Button>
        </>
    );
};
