import { useEffect, useMemo, useSyncExternalStore } from "react";

const ROOT_REFRESH_EVENT = "bareroute-refresh-root";

export type RouterMethod = "push" | "replace" | "go" | "back" | "forward";

export interface RouterMethodOptions {
  refreshRoot?: boolean;
  routeId?: string;
}

export interface RouterEventDetail {
  method: RouterMethod;
  href: string;
  pathname: string;
  refreshRoot: boolean;
  routeId?: string;
  state: unknown;
  delta?: number;
  url?: string;
}

export type RouterEvent = CustomEvent<RouterEventDetail>;

export function getRouteEventName(routeId: string) {
  return `bareroute-route-${routeId}`;
}

function dispatchRootRefresh() {
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
    state: window.history.state,
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

      window.history.pushState(data, "", url);

      dispatchRouteEvent(
        options.routeId,
        createRouterEventDetail("push", refreshRoot, options.routeId, { url })
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    replace: (url: string, data?: unknown, options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;

      window.history.replaceState(data, "", url);

      dispatchRouteEvent(
        options.routeId,
        createRouterEventDetail("replace", refreshRoot, options.routeId, { url })
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    go: (delta: number, options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;

      window.history.go(delta);

      dispatchRouteEvent(
        options.routeId,
        createRouterEventDetail("go", refreshRoot, options.routeId, { delta })
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    back: (options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;

      window.history.back();

      dispatchRouteEvent(
        options.routeId,
        createRouterEventDetail("back", refreshRoot, options.routeId)
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
    },
    forward: (options: RouterMethodOptions = {}) => {
      const refreshRoot = options.refreshRoot ?? true;

      window.history.forward();

      dispatchRouteEvent(
        options.routeId,
        createRouterEventDetail("forward", refreshRoot, options.routeId)
      );

      if (refreshRoot) {
        dispatchRootRefresh();
      }
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
