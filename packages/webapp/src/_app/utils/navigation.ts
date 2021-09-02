import { ROUTES } from "_app/config";

export const NAV_MENU_ITEMS = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((k) => !k.hideNav);
