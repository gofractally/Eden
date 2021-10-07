import { useEffect, useState } from "react";

import { Route, ROUTES } from "../routes";
import {
    useElectionState,
    useIsCommunityActive,
    useCurrentMember,
} from "../hooks";

const AVAILABLE_ROUTES = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((route) => !route.hideNav);

const filterStaticRoutes = (route: Route) =>
    !route.requiresActiveCommunity &&
    !route.requiresCompletedElection &&
    !route.requiresMembership;

const filterRequiredActiveCommunity = (
    route: Route,
    isActiveCommunity?: boolean
) =>
    !route.requiresActiveCommunity ||
    (route.requiresActiveCommunity && isActiveCommunity);

const filterCompletedElection = (route: Route, isElectionCompleted?: boolean) =>
    !route.requiresCompletedElection ||
    (route.requiresCompletedElection && isElectionCompleted);

const filterRequiredMembership = (route: Route, isMember?: boolean) =>
    !route.requiresMembership || (route.requiresMembership && isMember);

const STATIC_ROUTES = AVAILABLE_ROUTES.filter(filterStaticRoutes);

export const useNavItems = () => {
    const [items, setItems] = useState<Route[]>(STATIC_ROUTES);
    const { data: currentMember } = useCurrentMember();
    const { data: isActiveCommunity } = useIsCommunityActive();
    const { data: electionState } = useElectionState();

    useEffect(() => {
        setItems(
            AVAILABLE_ROUTES.filter((route) =>
                filterRequiredActiveCommunity(route, isActiveCommunity)
            )
                .filter((route) =>
                    filterCompletedElection(
                        route,
                        Boolean(electionState?.lead_representative)
                    )
                )
                .filter((route) =>
                    filterRequiredMembership(route, Boolean(currentMember))
                )
        );
    }, [isActiveCommunity, electionState, currentMember]);

    return items;
};
