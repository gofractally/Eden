import { useEffect, useState } from "react";

import { Route, ROUTES } from "../config";
import { useIsCommunityActive } from "../hooks";

const AVAILABLE_ROUTES = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((route) => !route.hideNav);

const filterRequiredActiveCommunity = (
    route: Route,
    isActiveCommunity?: boolean
) =>
    !route.requiresActiveCommunity ||
    (route.requiresActiveCommunity && isActiveCommunity);

const STATIC_ROUTES = AVAILABLE_ROUTES.filter((route) =>
    filterRequiredActiveCommunity(route)
);

export const useNavItems = () => {
    const [items, setItems] = useState<Route[]>(STATIC_ROUTES);
    const { data: isActiveCommunity } = useIsCommunityActive();

    useEffect(() => {
        setItems(
            AVAILABLE_ROUTES.filter((route) =>
                filterRequiredActiveCommunity(route, isActiveCommunity)
            )
        );
    }, [isActiveCommunity]);

    return items;
};
