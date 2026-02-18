
import { AppScreen } from '../types';

interface RouteState {
    screen: AppScreen;
    params: Record<string, string>;
}

const SCREEN_ROUTES: Record<AppScreen, string> = {
    [AppScreen.VERIFY]: '/verify',
    [AppScreen.LOGIN]: '/login',
    [AppScreen.SETUP_PROFILE]: '/setup',
    [AppScreen.LANDING]: '/',
    [AppScreen.FEED]: '/feed',
    [AppScreen.DETAILS]: '/item',
    [AppScreen.CREATE]: '/create',
    [AppScreen.BIDS]: '/bids',
    [AppScreen.DELIVERY]: '/delivery',
    [AppScreen.MESSAGES]: '/messages',
    [AppScreen.PROFILE]: '/profile',
    [AppScreen.CHAT_DETAIL]: '/chat',
    [AppScreen.LIVE_STATUS]: '/live',
    [AppScreen.MAP_LOCATION]: '/map',
    [AppScreen.MY_LISTINGS]: '/my-listings',
    [AppScreen.PURCHASE_HISTORY]: '/purchase-history',
    [AppScreen.PAYMENT_METHODS]: '/payments',
    [AppScreen.ACCOUNT_SETTINGS]: '/settings',
    [AppScreen.NOTIFICATIONS]: '/notifications',
    [AppScreen.FAVORITES]: '/favorites',
    [AppScreen.CHECKOUT]: '/checkout',
};

const ROUTE_TO_SCREEN = Object.fromEntries(
    Object.entries(SCREEN_ROUTES).map(([screen, route]) => [route, screen as AppScreen])
);

/**
 * Push a new hash route
 */
export function pushRoute(screen: AppScreen, params: Record<string, string> = {}) {
    const route = SCREEN_ROUTES[screen] || '/';
    const search = Object.keys(params).length
        ? '?' + new URLSearchParams(params).toString()
        : '';
    const hash = `#${route}${search}`;
    if (window.location.hash !== hash) {
        window.location.hash = hash;
    }
}

/**
 * Replace current hash (no history entry)
 */
export function replaceRoute(screen: AppScreen, params: Record<string, string> = {}) {
    const route = SCREEN_ROUTES[screen] || '/';
    const search = Object.keys(params).length
        ? '?' + new URLSearchParams(params).toString()
        : '';
    const hash = `#${route}${search}`;
    window.history.replaceState(null, '', hash);
}

/**
 * Parse the current hash into a RouteState
 */
export function parseHash(): RouteState {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [path, queryString] = raw.split('?');
    const params: Record<string, string> = {};
    if (queryString) {
        new URLSearchParams(queryString).forEach((v, k) => {
            params[k] = v;
        });
    }
    const screen = ROUTE_TO_SCREEN[path] || AppScreen.FEED;
    return { screen, params };
}

/**
 * Subscribe to hash changes
 */
export function onRouteChange(callback: (state: RouteState) => void): () => void {
    const handler = () => callback(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
}
