import { DistributionStateData, NextDistribution, Pool } from "../interfaces";

export const fixtureNextDistribution: DistributionStateData = {
    state: "next_distribution",
    data: {
        distribution_time: "2022-01-20T16:00:00.000",
    } as NextDistribution,
};

export const fixturePool: Pool = {
    name: "master",
    monthly_distribution_pct: 5,
};
