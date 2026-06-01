import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { format } from "date-fns";
import { PostCard } from "./PostCard";
import type { Post, Category } from "@/lib/db/schema";

type PostWithCategory = Post & { category: Category | null };

const basePost: PostWithCategory = {
  id: 1,
  title: "Test Post Title",
  slug: "test-post-title",
  content: "Some content here for the post.",
  excerpt: null,
  categoryId: null,
  featuredImage: null,
  status: "published",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  publishedAt: new Date("2024-01-15T10:00:00Z"),
  category: null,
};

const category: Category = {
  id: 10,
  name: "Technology",
  slug: "technology",
  createdAt: new Date("2024-01-01T00:00:00Z"),
};

describe("PostCard", () => {
  it("renders the post title", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("shows post.excerpt when set", () => {
    const post = { ...basePost, excerpt: "This is a custom excerpt." };
    render(<PostCard post={post} />);
    expect(screen.getByText("This is a custom excerpt.")).toBeInTheDocument();
  });

  it("falls back to stripped content when no excerpt", () => {
    const post = {
      ...basePost,
      excerpt: null,
      content: "## Heading\n\nThis is **bold** and `code` text.",
    };
    render(<PostCard post={post} />);
    expect(screen.getByText(/Heading/)).toBeInTheDocument();
  });

  it("truncates content fallback at 160 chars with ellipsis", () => {
    const longContent = "A".repeat(200);
    const post = { ...basePost, excerpt: null, content: longContent };
    render(<PostCard post={post} />);
    const intro = screen.getByText(/A+…/);
    expect(intro.textContent?.endsWith("…")).toBe(true);
    expect(intro.textContent!.length).toBeLessThanOrEqual(161 + 1); // 160 + "…"
  });

  it("strips markdown chars from content fallback", () => {
    const post = {
      ...basePost,
      excerpt: null,
      content: "# Title\n\n**bold** text with `code` and [link](url)",
    };
    render(<PostCard post={post} />);
    // The stripped version should not contain #, **, `, [, ]
    const paragraphs = screen.getAllByText(/Title/);
    const introParagraph = paragraphs.find((el) => el.tagName === "P");
    expect(introParagraph).toBeDefined();
    expect(introParagraph!.textContent).not.toMatch(/[#*`\[\]]/);
  });

  it("priority=true sets loading=eager on image", () => {
    const post = { ...basePost, featuredImage: "/uploads/test.jpg" };
    const { container } = render(<PostCard post={post} priority />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("default priority is false and sets loading=lazy", () => {
    const post = { ...basePost, featuredImage: "/uploads/test.jpg" };
    const { container } = render(<PostCard post={post} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("does not render image when featuredImage is null", () => {
    render(<PostCard post={basePost} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders category link when category is present", () => {
    const post = { ...basePost, category };
    render(<PostCard post={post} />);
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("does not render category section when category is null", () => {
    render(<PostCard post={basePost} />);
    expect(screen.queryByText("Technology")).toBeNull();
  });

  it("renders formatted date", () => {
    render(<PostCard post={basePost} />);
    // publishedAt is 2024-01-15 -> "January 15, 2024"
    expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
  });

  it("renders Read more link", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Read more")).toBeInTheDocument();
  });

  it("falls back to createdAt when publishedAt is null", () => {
    const createdAt = new Date("2024-03-10T12:00:00Z");
    const post = { ...basePost, publishedAt: null, createdAt };
    render(<PostCard post={post} />);
    const expected = format(createdAt, "MMMM d, yyyy");
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders separator dot when category is present", () => {
    const post = { ...basePost, category };
    const { container } = render(<PostCard post={post} />);
    expect(container.textContent).toContain("·");
  });
});
