import { getElectionState } from "elections/api";

const getDelegates = () => {
    return {}; // TODO
};

export const getHeadDelegate = async (): Promise<string | undefined> => {
    const electionState = await getElectionState();
    return electionState?.lead_representative;
};

export const getChiefDelegates = async (): Promise<string[] | undefined> => {
    const electionState = await getElectionState();
    return electionState?.board;
};

const getMemberBudgetBalance = () => {
    return {}; // TODO
};

const getMemberElectionParticipationStatus = () => {
    return {}; // TODO
};

const hasMemberRSVPed = () => {
    return false; // TODO
};

export const getMyDelegation = () => {
    return {}; // TODO
};
