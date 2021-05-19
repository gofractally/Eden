import React from "react";
import { Text } from "_app";
import { getInductionRemainingTimeDays } from "inductions";
import { Induction } from "inductions/interfaces";

export const InductionExpiresIn = ({ induction }: { induction: Induction }) => (
    <Text className="mb-6">
        This invitation expires in {getInductionRemainingTimeDays(induction)}.
    </Text>
);
