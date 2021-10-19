import { useWindowSize } from "_app/hooks";

export const useCommunityWindowInfo = () => {
    const { height, width } = useWindowSize();

    const MOBILE_TOP_NAV_HEIGHT = 56;
    const MOBILE_BOTTOM_NAV_HEIGHT = 64;
    const MOBILE_NAV_HEIGHT = MOBILE_TOP_NAV_HEIGHT + MOBILE_BOTTOM_NAV_HEIGHT;

    const HEADER_HEIGHT = 77; // Community heading
    const FOOTER_HEIGHT = 205; // Eden links footer

    const INLINE_HEIGHT_BREAKPOINT = 1000;
    const CONSERVE_VERTICAL_SPACE = Boolean(
        height && height < INLINE_HEIGHT_BREAKPOINT
    );

    const MOBILE_WIDTH_BREAKPOINT = 475;
    const IS_MOBILE_LAYOUT_ACTIVE = Boolean(
        width && width < MOBILE_WIDTH_BREAKPOINT
    );

    let listHeight = height ?? 0;

    if (!CONSERVE_VERTICAL_SPACE) {
        listHeight = listHeight - HEADER_HEIGHT - FOOTER_HEIGHT;
    }

    if (IS_MOBILE_LAYOUT_ACTIVE) {
        listHeight = listHeight - MOBILE_NAV_HEIGHT;
    }

    return {
        listHeight,
        isSmallScreen: CONSERVE_VERTICAL_SPACE,
    };
};
