import dayjs from "dayjs";

import { tokenConfig } from "config";
import { Container, Heading, Text, useDistributionState } from "_app";

export const TreasuryDisbursementsInfo = () => {
    const { data: distributionState } = useDistributionState();

    const nextDisbursementTime =
        distributionState &&
        dayjs(distributionState.data.distribution_time + "Z").format("LL");

    return (
        <Container className="space-y-2.5">
            <Heading size={2}>Monthly disbursements</Heading>
            <Text>
                Eden delegate disbursements occur monthly and are claimed by the
                delegate from the contract to their personal{" "}
                {tokenConfig.symbol} accounts.
            </Text>
            <Text>
                The overall disbursement is equal to 5% of the Eden treasury at
                the time of disbursement. The amount is then divided equally
                among the representative levels. At each level, the amount is
                further divided equally among that level's representatives.
            </Text>
            {nextDisbursementTime && (
                <Text>
                    Next disbursement date:{" "}
                    <span className="font-medium">{nextDisbursementTime}</span>
                </Text>
            )}
        </Container>
    );
};

export default TreasuryDisbursementsInfo;
