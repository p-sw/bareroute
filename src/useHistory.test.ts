import { expect, test, describe } from "bun:test";
import { useHistory } from "./useHistory";
import { renderHook, act } from "@testing-library/react";
import { Window } from "happy-dom";

const window = new Window({ url: "http://localhost/" });
(global as any).window = window;
(global as any).document = window.document;
(global as any).navigator = window.navigator;
(global as any).location = window.location;
(global as any).history = window.history;
(global as any).PopStateEvent = window.PopStateEvent;
(global as any).Node = window.Node;
(global as any).Element = window.Element;
(global as any).CharacterData = window.CharacterData;
(global as any).Text = window.Text;

describe("useHistory", () => {
  test("should return current href", () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.href).toBe("http://localhost/");
  });

  test("should have push and replace methods", () => {
    const { result } = renderHook(() => useHistory());
    expect(typeof result.current.push).toBe("function");
    expect(typeof result.current.replace).toBe("function");
  });

  test("push should update href", () => {
    const { result } = renderHook(() => useHistory());
    
    act(() => {
      result.current.push("/new-url");
    });
    
    expect(window.location.pathname).toBe("/new-url");
    expect(result.current.href).toBe("http://localhost/new-url");
  });
});
