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
      result.current.router.push("/silent", undefined, { refreshRoot: false });
    });

    expect(window.location.pathname).toBe("/silent");
    expect(result.current.root).toBe("/");
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
});
