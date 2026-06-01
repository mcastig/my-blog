import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock the database import
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([
        { id: 1, name: "Technology", slug: "technology", createdAt: new Date() },
        { id: 2, name: "Science", slug: "science", createdAt: new Date() },
      ]),
    }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  categories: {},
}));

// Mock child components
vi.mock("@/components/blog/ThemeToggle/ThemeToggle", () => ({
  ThemeToggle: () => React.createElement("button", { "aria-label": "Toggle theme" }),
}));

vi.mock("@/components/blog/SearchBar/SearchBar", () => ({
  SearchBar: () => React.createElement("div", { "data-testid": "search-bar" }, "Search"),
}));

vi.mock("@/components/blog/MobileMenu/MobileMenu", () => ({
  MobileMenu: ({ cats }: { cats: { id: number; name: string; slug: string }[] }) =>
    React.createElement(
      "div",
      { "data-testid": "mobile-menu" },
      cats.map((c) => React.createElement("span", { key: c.id }, c.name))
    ),
}));

describe("Header", () => {
  it("renders the blog title link", async () => {
    const { Header } = await import("./Header");
    const jsx = await Header();
    const { container } = render(jsx as React.ReactElement);
    expect(container.querySelector("a[href='/']")).toBeInTheDocument();
    expect(screen.getByText("My Blog")).toBeInTheDocument();
  });

  it("renders category links from database", async () => {
    const { Header } = await import("./Header");
    const jsx = await Header();
    render(jsx as React.ReactElement);
    expect(screen.getAllByText("Technology").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Science").length).toBeGreaterThan(0);
  });

  it("renders ThemeToggle", async () => {
    const { Header } = await import("./Header");
    const jsx = await Header();
    render(jsx as React.ReactElement);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("renders SearchBar", async () => {
    const { Header } = await import("./Header");
    const jsx = await Header();
    render(jsx as React.ReactElement);
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
  });

  it("renders MobileMenu with categories", async () => {
    const { Header } = await import("./Header");
    const jsx = await Header();
    render(jsx as React.ReactElement);
    expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
  });
});
