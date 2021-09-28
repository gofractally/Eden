import { useEffect, useState } from "react";

import { Route, ROUTES } from "../routes";
import { useElectionState, useIsCommunityActive } from "../hooks";

const AVAILABLE_ROUTES = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((route) => !route.hideNav);

const filterStaticRoutes = (route: Route) =>
    !route.requiresActiveCommunity && !route.requiresCompletedElection;

const filterRequiredActiveCommunity = (
    route: Route,
    isActiveCommunity?: boolean
) =>
    !route.requiresActiveCommunity ||
    (route.requiresActiveCommunity && isActiveCommunity);

const filterCompletedElection = (route: Route, isElectionCompleted?: boolean) =>
    !route.requiresCompletedElection ||
    (route.requiresCompletedElection && isElectionCompleted);

const STATIC_ROUTES = AVAILABLE_ROUTES.filter(filterStaticRoutes);

export const useNavItems = () => {
    const [items, setItems] = useState<Route[]>(STATIC_ROUTES);
    const { data: isActiveCommunity } = useIsCommunityActive();
    const { data: electionState } = useElectionState();

    useEffect(() => {
        setItems(
            AVAILABLE_ROUTES.filter((route) =>
                filterRequiredActiveCommunity(route, isActiveCommunity)
            ).filter((route) =>
                filterCompletedElection(
                    route,
                    Boolean(electionState?.lead_representative)
                )
            )
        );
    }, [isActiveCommunity, electionState]);

    return items;
};
