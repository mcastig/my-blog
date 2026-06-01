import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu } from "./MobileMenu";

// Mock SearchBar to avoid its complexity in MobileMenu tests
vi.mock("@/components/blog/SearchBar/SearchBar", () => ({
  SearchBar: () =>
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("react").createElement("div", { "data-testid": "search-bar" }, "SearchBar"),
}));

const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => mockPathname(),
}));

const cats = [
  { id: 1, name: "Technology", slug: "technology" },
  { id: 2, name: "Science", slug: "science" },
];

// Capture MutationObserver callbacks
let mutationObserverCallback: MutationCallback | null = null;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

vi.stubGlobal(
  "MutationObserver",
  class MockMutationObserver {
    constructor(cb: MutationCallback) {
      mutationObserverCallback = cb;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
  }
);

describe("MobileMenu", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    document.documentElement.classList.remove("dark");
    document.body.style.overflow = "";
    mutationObserverCallback = null;
    mockObserve.mockClear();
    mockDisconnect.mockClear();
  });

  it("hamburger button is rendered", () => {
    render(<MobileMenu cats={cats} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("clicking hamburger opens the menu", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
  });

  it("menu shows SearchBar and category links when open", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
  });

  it("clicking hamburger again closes the menu (X icon shown when open)", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    // Now shows "Close menu"
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByTestId("search-bar")).toBeNull();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("route change closes the menu", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();

    // Simulate route change
    mockPathname.mockReturnValue("/category/technology");
    rerender(<MobileMenu cats={cats} />);
    await waitFor(() => {
      expect(screen.queryByTestId("search-bar")).toBeNull();
    });
  });

  it("body overflow is hidden when open, restored on close", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.body.style.overflow).toBe("");
  });

  it("MutationObserver fires when .dark class is toggled — bg/fg colors change", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={cats} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    // Add dark class and fire mutation observer callback
    act(() => {
      document.documentElement.classList.add("dark");
      if (mutationObserverCallback) {
        mutationObserverCallback([], {} as MutationObserver);
      }
    });

    // The menu div should now use dark bg — jsdom converts hex to rgb
    const menuDiv = screen.getByTestId("search-bar").closest(".sm\\:hidden") as HTMLElement;
    expect(menuDiv).toBeTruthy();
    // In dark mode: bg is #0a0a0a = rgb(10, 10, 10)
    const style = menuDiv?.getAttribute("style") || "";
    expect(style).toMatch(/rgb\(10,\s*10,\s*10\)|10, 10, 10|0a0a0a/);
  });

  it("empty cats array: no Categories section shown", async () => {
    const user = userEvent.setup();
    render(<MobileMenu cats={[]} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByText("Categories")).toBeNull();
  });

  it("MutationObserver is disconnected on unmount", () => {
    const { unmount } = render(<MobileMenu cats={cats} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
