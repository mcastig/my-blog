import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminNav } from "./AdminNav";

const mockUsePathname = vi.fn(() => "/admin");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => mockUsePathname(),
}));

describe("AdminNav", () => {
  const defaultProps = {
    username: "admin",
    firstName: null,
    lastName: null,
  };

  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin");
  });

  it("returns null when pathname is /admin/login", () => {
    mockUsePathname.mockReturnValue("/admin/login");
    const { container } = render(<AdminNav {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders header when pathname is not /admin/login", () => {
    render(<AdminNav {...defaultProps} />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders Dashboard link", () => {
    render(<AdminNav {...defaultProps} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Categories link", () => {
    render(<AdminNav {...defaultProps} />);
    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("renders New Post link", () => {
    render(<AdminNav {...defaultProps} />);
    expect(screen.getByText("New Post")).toBeInTheDocument();
  });

  it("active link for /admin has bg-surface styling", () => {
    render(<AdminNav {...defaultProps} />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-[var(--color-surface)]");
  });

  it("non-active link does not have bg-surface styling", () => {
    render(<AdminNav {...defaultProps} />);
    const categoriesLink = screen.getByText("Categories").closest("a");
    expect(categoriesLink?.className).not.toContain("bg-[var(--color-surface)]");
  });

  it("renders ProfileMenu with username prop", () => {
    render(<AdminNav {...defaultProps} username="john" />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders ThemeToggle button", () => {
    render(<AdminNav {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  describe("hamburger menu", () => {
    it("hamburger button is present with label 'Open menu'", () => {
      render(<AdminNav {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    });

    it("mobile menu is not rendered by default", () => {
      render(<AdminNav {...defaultProps} />);
      // Desktop nav has one copy; mobile nav not rendered yet
      expect(screen.getAllByText("Dashboard").length).toBe(1);
    });

    it("clicking hamburger opens mobile menu with all nav links", async () => {
      const user = userEvent.setup();
      render(<AdminNav {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      // Both desktop nav and mobile nav are now in the DOM
      expect(screen.getAllByText("Dashboard").length).toBe(2);
      expect(screen.getAllByText("Categories").length).toBe(2);
      expect(screen.getAllByText("New Post").length).toBe(2);
    });

    it("hamburger button label changes to 'Close menu' when open", async () => {
      const user = userEvent.setup();
      render(<AdminNav {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
    });

    it("clicking hamburger again closes the mobile menu", async () => {
      const user = userEvent.setup();
      render(<AdminNav {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getAllByText("Dashboard").length).toBe(2);
      await user.click(screen.getByRole("button", { name: "Close menu" }));
      expect(screen.getAllByText("Dashboard").length).toBe(1);
    });

    it("clicking a mobile nav link closes the menu", async () => {
      const user = userEvent.setup();
      render(<AdminNav {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getAllByText("Dashboard").length).toBe(2);
      // Click the mobile copy (last in DOM order)
      const links = screen.getAllByRole("link", { name: "Dashboard" });
      await user.click(links[links.length - 1]);
      expect(screen.getAllByText("Dashboard").length).toBe(1);
    });

    it("mobile menu active link has bg-surface styling", async () => {
      const user = userEvent.setup();
      render(<AdminNav {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Open menu" }));
      const mobileLinks = screen.getAllByRole("link", { name: "Dashboard" });
      const mobileActive = mobileLinks[mobileLinks.length - 1];
      expect(mobileActive.className).toContain("bg-[var(--color-surface)]");
    });
  });
});
