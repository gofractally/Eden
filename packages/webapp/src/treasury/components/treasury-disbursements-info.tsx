import dayjs from "dayjs";
import { Heading, Text, useDistributionState } from "_app";

export const TreasuryDisbursementsInfo = () => {
    const { data: distributionState } = useDistributionState();

    const nextDisbursementTime =
        distributionState &&
        dayjs(distributionState.data.distribution_time + "Z").format("LL");

    return (
        <div className="space-y-2">
            <Heading size={2}>Monthly Disbursements</Heading>
            <Text>
                Eden delegate disbursements occur monthly and are claimed by the
                delegate from the contract to their personal EOS accounts.
            </Text>
            <Text>
                The overall disbursement is equal to 5% of the Eden treasury at
                the time of disbursement. The amount is then divided equally
                between the representative levels. At each level the amount is
                divided equally between the representatives in that level.
            </Text>
            {nextDisbursementTime && (
                <Text>Next disbursement date: {nextDisbursementTime}</Text>
            )}
        </div>
    );
};

export default TreasuryDisbursementsInfo;
