import { Text } from "_app";
import { getInductionRemainingTimeDays } from "inductions";
import { Induction } from "inductions/interfaces";

export const InductionExpiresIn = ({ induction }: { induction: Induction }) => (
    <Text className="mb-4">
        This invitation expires in {getInductionRemainingTimeDays(induction)}.
    </Text>
);
