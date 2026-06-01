import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostContent } from "./PostContent";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock("remark-gfm", () => ({ default: () => {} }));
vi.mock("rehype-highlight", () => ({ default: () => {} }));

describe("PostContent", () => {
  it("renders markdown content", () => {
    render(<PostContent content="Hello **world**" />);
    expect(screen.getByText("Hello **world**")).toBeInTheDocument();
  });

  it("has prose class on wrapper", () => {
    const { container } = render(<PostContent content="test" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("prose");
  });

  it("renders empty content without error", () => {
    const { container } = render(<PostContent content="" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
