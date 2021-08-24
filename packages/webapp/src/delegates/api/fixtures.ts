import {
    DistributionAccount,
    DistributionStateData,
    NextDistribution,
} from "../interfaces";

export const fixtureDistributionAccounts: DistributionAccount[] = [
    {
        owner: "pip.edev",
        balance: "10.0000 EOS",
        rank: 1,
        distribution_time: "2022-01-16T16:00:00.000",
    },
    {
        owner: "pip.edev",
        balance: "100.0000 EOS",
        rank: 2,
        distribution_time: "2022-01-16T16:00:00.000",
    },
    {
        owner: "pip.edev",
        balance: "1000.0000 EOS",
        rank: 3,
        distribution_time: "2022-01-16T16:00:00.000",
    },
];

export const fixtureNextDistribution: DistributionStateData = {
    state: "next_distribution",
    data: {
        distribution_time: "2022-01-20T16:00:00.000",
    } as NextDistribution,
};
