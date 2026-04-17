import { useEffect, useMemo, useSyncExternalStore } from "react";

const ROOT_REFRESH_EVENT = "bareroute-refresh-root";
const BAREROUTE_STATE_KEY = "__bareroute";

let skipNextPopStateRefresh = false;

export type RouterMethod = "push" | "replace" | "go" | "back" | "forward";

export type RouterMethodOptions =
  | { refreshRoot?: true; routeId?: string }
  | { refreshRoot: false; routeId: string };

interface BarerouteState {
  [BAREROUTE_STATE_KEY]: true;
  data: unknown;
  refreshRoot: boolean;
}

export interface RouterEventDetail {
  method: RouterMethod;
  href: string;
  pathname: string;
  refreshRoot: boolean;
  routeId?: string;
  state: unknown;
  dispatchRootRefresh: typeof dispatchRootRefresh;
  delta?: number;
  url?: string;
}

export type RouterEvent = CustomEvent<RouterEventDetail>;

export function getRouteEventName(routeId: string) {
  return `bareroute-route-${routeId}`;
}

function isBarerouteState(state: unknown): state is BarerouteState {
  return (
    typeof state === "object" &&
    state !== null &&
    BAREROUTE_STATE_KEY in state &&
    (state as Record<string, unknown>)[BAREROUTE_STATE_KEY] === true
  );
}

function createHistoryState(data: unknown, refreshRoot: boolean): BarerouteState {
  return {
    [BAREROUTE_STATE_KEY]: true,
    data,
    refreshRoot,
  };
}

function getRouteState(state: unknown) {
  return isBarerouteState(state) ? state.data : state;
}

function shouldRefreshRoot(state: unknown) {
  return !isBarerouteState(state) || state.refreshRoot;
}

function getRouteId(options: RouterMethodOptions) {
  if (options.refreshRoot === false && !options.routeId) {
    throw new Error("routeId is required when refreshRoot is false.");
  }

  return options.routeId;
}

export function dispatchRootRefresh() {
  window.dispatchEvent(new CustomEvent(ROOT_REFRESH_EVENT));
}

function createRouterEventDetail(
  method: RouterMethod,
  refreshRoot: boolean,
  routeId?: string,
  detail: Partial<RouterEventDetail> = {}
): RouterEventDetail {
  return {
    method,
    href: window.location.href,
    pathname: window.location.pathname,
    refreshRoot,
    routeId,
    state: getRouteState(window.history.state),
    dispatchRootRefresh,
    ...detail,
  };
}

function dispatchRouteEvent(routeId: string | undefined, detail: RouterEventDetail) {
  if (!routeId) {
    return;
  }

  window.dispatchEvent(new CustomEvent(getRouteEventName(routeId), { detail }));
}

function subscribeToRoot(onStoreChange: () => void) {
  window.addEventListener(ROOT_REFRESH_EVENT, onStoreChange);

  return () => window.removeEventListener(ROOT_REFRESH_EVENT, onStoreChange);
}

function getRootSnapshot() {
  return window.location.pathname;
}

function getRootServerSnapshot() {
  return "/";
}

export function History() {
  useEffect(() => {
    const handlePopState = () => {
      if (skipNextPopStateRefresh) {
        skipNextPopStateRefresh = false;
        return;
      }

      if (!shouldRefreshRoot(window.history.state)) {
        return;
      }

      dispatchRootRefresh();
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return null;
}

/**
 * A hook that returns the current pathname and updates when bareroute refreshes the root.
 */
export function useRoot() {
  return useSyncExternalStore(subscribeToRoot, getRootSnapshot, getRootServerSnapshot);
}

/**
 * A hook that exposes navigation helpers for the browser History API.
 */
export function useRouter() {
  return useMemo(() => ({
    push: (url: string, data?: unknown, options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;
      const routeId = getRouteId(options);

      window.history.pushState(createHistoryState(data, refreshRoot), "", url);

      dispatchRouteEvent(
        routeId,
        createRouterEventDetail("push", refreshRoot, routeId, { url })
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    replace: (url: string, data?: unknown, options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;
      const routeId = getRouteId(options);

      window.history.replaceState(createHistoryState(data, refreshRoot), "", url);

      dispatchRouteEvent(
        routeId,
        createRouterEventDetail("replace", refreshRoot, routeId, { url })
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    go: (delta: number, options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;
      const routeId = getRouteId(options);

      if (!refreshRoot) {
        skipNextPopStateRefresh = true;
      }

      window.history.go(delta);

      dispatchRouteEvent(
        routeId,
        createRouterEventDetail("go", refreshRoot, routeId, { delta })
      );
    },
    back: (options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;
      const routeId = getRouteId(options);

      if (!refreshRoot) {
        skipNextPopStateRefresh = true;
      }

      window.history.back();

      dispatchRouteEvent(
        routeId,
        createRouterEventDetail("back", refreshRoot, routeId)
      );
    },
    forward: (options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;
      const routeId = getRouteId(options);

      if (!refreshRoot) {
        skipNextPopStateRefresh = true;
      }

      window.history.forward();

      dispatchRouteEvent(
        routeId,
        createRouterEventDetail("forward", refreshRoot, routeId)
      );
    },
  }), []);
}

/**
 * A hook that listens for router calls dispatched to a specific route id.
 */
export function useRouterListener(listener: (event: RouterEvent) => void, routeId: string) {
  useEffect(() => {
    const eventName = getRouteEventName(routeId);
    const handleEvent = (event: Event) => {
      listener(event as RouterEvent);
    };

    window.addEventListener(eventName, handleEvent);

    return () => window.removeEventListener(eventName, handleEvent);
  }, [listener, routeId]);
}
