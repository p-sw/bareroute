import { useSyncExternalStore, useMemo } from "react";

/**
 * A hook that provides access to the browser's History API and keeps track of the current location.
 */
export function useHistory() {
  const subscribe = useMemo(() => {
    return (onStoreChange: () => void) => {
      window.addEventListener("popstate", onStoreChange);
      return () => window.removeEventListener("popstate", onStoreChange);
    };
  }, []);

  const getSnapshot = () => window.location.href;

  // We use useSyncExternalStore to subscribe to window.location changes.
  // Note: This only catches popstate events.
  const href = useSyncExternalStore(subscribe, getSnapshot, () => "");

  const historyActions = useMemo(() => ({
    push: (url: string, data?: any) => {
      window.history.pushState(data, "", url);
      // pushState doesn't trigger popstate, so we manually trigger it if needed or just use the updated state
      // Most React routers handle this by wrapping pushState
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    replace: (url: string, data?: any) => {
      window.history.replaceState(data, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    go: (delta: number) => window.history.go(delta),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    get location() {
      return window.location;
    },
    get state() {
      return window.history.state;
    }
  }), []);

  return {
    href,
    ...historyActions
  };
}
