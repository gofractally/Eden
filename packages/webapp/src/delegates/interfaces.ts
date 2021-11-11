export interface DistributionAccount {
    distributionTime: string;
    rank: number;
    balance: string;
}

export type DistributionState =
    | "next_distribution"
    | "election_distribution"
    | "current_distribution";

export interface DistributionBase {
    distribution_time: string;
}

export type NextDistribution = DistributionBase;

export interface ElectionDistribution extends DistributionBase {
    amount: string;
}

export interface CurrentDistribution extends DistributionBase {
    last_processed: string;
    rank_distribution: string[];
}

export type Distribution =
    | NextDistribution
    | ElectionDistribution
    | CurrentDistribution;

export interface DistributionStateData {
    state: DistributionState;
    data: Distribution;
}

export interface Pool {
    name: string;
    monthly_distribution_pct: number;
}
