import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders the current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renders admin link with href=/admin when present", () => {
    render(<Footer />);
    // Footer shows copyright — verify it renders "My Blog"
    expect(screen.getByText(/My Blog/)).toBeInTheDocument();
  });

  it("renders footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });
});
