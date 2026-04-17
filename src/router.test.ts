import { beforeEach, describe, expect, test } from "bun:test";
import { act, render, renderHook } from "@testing-library/react";
import { Window } from "happy-dom";
import { createElement } from "react";
import { History, type RouterEvent, useRoot, useRouter, useRouterListener } from "./router";

function installDom(url = "http://localhost/") {
  const domWindow = new Window({ url });

  (global as any).window = domWindow;
  (global as any).document = domWindow.document;
  (global as any).navigator = domWindow.navigator;
  (global as any).location = domWindow.location;
  (global as any).history = domWindow.history;
  (global as any).Event = domWindow.Event;
  (global as any).CustomEvent = domWindow.CustomEvent;
  (global as any).PopStateEvent = domWindow.PopStateEvent;
  (global as any).Node = domWindow.Node;
  (global as any).Element = domWindow.Element;
  (global as any).HTMLElement = domWindow.HTMLElement;
  (global as any).CharacterData = domWindow.CharacterData;
  (global as any).Text = domWindow.Text;
}

beforeEach(() => {
  installDom();
});

describe("useRoot", () => {
  test("returns the current pathname and updates after push", () => {
    const { result } = renderHook(() => ({
      root: useRoot(),
      router: useRouter(),
    }));

    expect(result.current.root).toBe("/");

    act(() => {
      result.current.router.push("/dashboard");
    });

    expect(window.location.pathname).toBe("/dashboard");
    expect(result.current.root).toBe("/dashboard");
  });

  test("does not refresh the root when refreshRoot is false", () => {
    const { result } = renderHook(() => ({
      root: useRoot(),
      router: useRouter(),
    }));

    act(() => {
      result.current.router.push("/silent", undefined, { refreshRoot: false, routeId: "silent" });
    });

    expect(window.location.pathname).toBe("/silent");
    expect(result.current.root).toBe("/");
  });

  test("requires routeId when refreshRoot is false", () => {
    const { result } = renderHook(() => useRouter());

    expect(() => {
      act(() => {
        result.current.push("/invalid", undefined, { refreshRoot: false } as never);
      });
    }).toThrow("routeId is required when refreshRoot is false.");
  });
});

describe("History", () => {
  test("refreshes useRoot when popstate fires", () => {
    render(createElement(History));

    const { result } = renderHook(() => useRoot());

    act(() => {
      window.history.pushState(undefined, "", "/popped");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current).toBe("/popped");
  });

  test("ignores popstate root refresh when the current entry disables it", () => {
    render(createElement(History));

    const { result } = renderHook(() => ({
      root: useRoot(),
      router: useRouter(),
    }));

    act(() => {
      result.current.router.push("/hidden", { from: "hidden" }, { refreshRoot: false, routeId: "hidden" });
      result.current.router.push("/visible");
    });

    expect(result.current.root).toBe("/visible");

    act(() => {
      window.history.back();
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(window.location.pathname).toBe("/hidden");
    expect(result.current.root).toBe("/visible");
  });
});

describe("useRouterListener", () => {
  test("listens only to its matching route id", () => {
    const events: RouterEvent[] = [];

    renderHook(() => useRouterListener((event) => events.push(event), "profile"));

    const { result } = renderHook(() => useRouter());

    act(() => {
      result.current.push("/ignored", undefined, { routeId: "settings" });
      result.current.replace("/profile", { id: 1 }, { routeId: "profile" });
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("bareroute-route-profile");
    expect(events[0]?.detail.method).toBe("replace");
    expect(events[0]?.detail.pathname).toBe("/profile");
    expect(events[0]?.detail.routeId).toBe("profile");
    expect(events[0]?.detail.state).toEqual({ id: 1 });
  });

  test("can manually dispatch a root refresh from the listener", () => {
    const { result: rootResult } = renderHook(() => useRoot());

    renderHook(() => useRouterListener((event) => {
      event.detail.dispatchRootRefresh();
    }, "manual"));

    const { result: routerResult } = renderHook(() => useRouter());

    act(() => {
      routerResult.current.push("/manual", { id: 2 }, { refreshRoot: false, routeId: "manual" });
    });

    expect(rootResult.current).toBe("/manual");
  });
});
