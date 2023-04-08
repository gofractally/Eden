import React from "react";
import dayjs from "dayjs";

import { Text, useDistributionState } from "_app";

export const NextDisbursementInfo = () => {
    const { data: distributionState } = useDistributionState();

    if (!distributionState) return null;

    switch (distributionState.state) {
        case "next_distribution":
            const nextDisbursementTime = dayjs(
                distributionState.data.distribution_time + "Z"
            );
            return (
                <Text>
                    Delegate funds are disbursed monthly. Check back on{" "}
                    {nextDisbursementTime.utc().format("LL")} UTC after{" "}
                    {nextDisbursementTime.utc().format("LT")} UTC for your next
                    disbursement.
                </Text>
            );
        case "election_distribution":
            return (
                <Text>
                    An election is currently underway. Disbursements to
                    newly-elected delegates will be processed as soon as the
                    election ends.
                </Text>
            );
        case "current_distribution":
            return (
                <Text>
                    A disbursement is being processed now. Check back in the
                    next few hours.
                </Text>
            );
        default:
            return null;
    }
};

export default NextDisbursementInfo;
