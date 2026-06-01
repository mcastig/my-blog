import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./ThemeProvider";

// Helper component to read context
function ThemeConsumer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("useTheme outside provider", () => {
  it("returns default context with theme=system", () => {
    function Standalone() {
      const ctx = useTheme();
      return <span data-testid="t">{ctx.theme}</span>;
    }
    render(<Standalone />);
    expect(screen.getByTestId("t").textContent).toBe("system");
  });

  it("default context setTheme noop can be called without error", () => {
    function Standalone() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme("dark")}>Set</button>;
    }
    render(<Standalone />);
    fireEvent.click(screen.getByText("Set"));
    expect(screen.getByText("Set")).toBeInTheDocument();
  });
});

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("initial theme is system when no localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it("reads stored theme from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("setTheme(dark) adds dark class to documentElement and saves to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText("Set Dark"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("setTheme(light) removes dark class from documentElement", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("dark");
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText("Set Light"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("setTheme(system) with dark system pref adds dark class", async () => {
    const user = userEvent.setup();
    // Override matchMedia to return dark
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText("Set System"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme(system) with light system pref removes dark class", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("dark");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText("Set System"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system pref change triggers update when theme is system", async () => {
    let changeHandler: (() => void) | undefined;
    const mockMq = {
      matches: false, // Start with light
      media: "(prefers-color-scheme: dark)",
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMq),
    });

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // Simulate system pref changing to dark by mutating mq.matches then calling handler
    act(() => {
      mockMq.matches = true;
      if (changeHandler) changeHandler();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("renders children", () => {
    render(
      <ThemeProvider>
        <span data-testid="child">hello</span>
      </ThemeProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("system pref change does not update theme when stored theme is not system", async () => {
    let changeHandler: (() => void) | undefined;
    const mockMq = {
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn().mockReturnValue(mockMq) });
    localStorage.setItem("theme", "dark");

    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);

    act(() => {
      mockMq.matches = true;
      if (changeHandler) changeHandler();
    });

    // onChange handler should skip the toggle because current theme is "dark", not "system"
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system pref change to light updates documentElement when theme is system", () => {
    let changeHandler: (() => void) | undefined;
    const mockMq = {
      matches: true,
      media: "(prefers-color-scheme: dark)",
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "change") changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMq),
    });
    document.documentElement.classList.add("dark");

    render(<ThemeProvider><ThemeConsumer /></ThemeProvider>);

    act(() => {
      mockMq.matches = false;
      if (changeHandler) changeHandler();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("cleanup removes matchMedia event listener on unmount", () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "",
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener,
        dispatchEvent: vi.fn(),
      }),
    });
    const { unmount } = render(
      <ThemeProvider>
        <span />
      </ThemeProvider>
    );
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
