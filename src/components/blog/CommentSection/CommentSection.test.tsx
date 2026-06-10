import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentSection } from "./CommentSection";
import type { Comment } from "@/lib/db/schema";

const baseComment: Comment = {
  id: 1,
  postId: 10,
  authorName: "Alice",
  email: null,
  content: "Great post!",
  status: "approved",
  createdAt: new Date("2024-03-01T12:00:00Z"),
};

describe("CommentSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("comment list", () => {
    it("renders 'Comments' heading when no comments", () => {
      render(<CommentSection postId={10} initialComments={[]} />);
      expect(screen.getByRole("heading", { name: "Comments" })).toBeInTheDocument();
    });

    it("renders comment count in heading when comments exist", () => {
      render(<CommentSection postId={10} initialComments={[baseComment]} />);
      expect(screen.getByRole("heading", { name: "1 Comment" })).toBeInTheDocument();
    });

    it("renders plural heading for multiple comments", () => {
      const comments = [baseComment, { ...baseComment, id: 2 }];
      render(<CommentSection postId={10} initialComments={comments} />);
      expect(screen.getByRole("heading", { name: "2 Comments" })).toBeInTheDocument();
    });

    it("renders comment author and content", () => {
      render(<CommentSection postId={10} initialComments={[baseComment]} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Great post!")).toBeInTheDocument();
    });

    it("renders formatted date for each comment", () => {
      render(<CommentSection postId={10} initialComments={[baseComment]} />);
      expect(screen.getByText("March 1, 2024")).toBeInTheDocument();
    });
  });

  describe("form rendering", () => {
    it("renders Name, Email, and Comment fields", () => {
      render(<CommentSection postId={10} initialComments={[]} />);
      expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Share your thoughts…")).toBeInTheDocument();
    });

    it("renders Post comment button", () => {
      render(<CommentSection postId={10} initialComments={[]} />);
      expect(screen.getByRole("button", { name: "Post comment" })).toBeInTheDocument();
    });

    it("Post comment button is disabled when name is empty", () => {
      render(<CommentSection postId={10} initialComments={[]} />);
      expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();
    });

    it("Post comment button is disabled when content is empty", async () => {
      const user = userEvent.setup();
      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      expect(screen.getByRole("button", { name: "Post comment" })).toBeDisabled();
    });

    it("Post comment button is enabled when name and content are filled", async () => {
      const user = userEvent.setup();
      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Nice article");
      expect(screen.getByRole("button", { name: "Post comment" })).not.toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("submits comment and appends it to the list on success", async () => {
      const user = userEvent.setup();
      const newComment: Comment = {
        ...baseComment,
        id: 99,
        authorName: "Bob",
        content: "Nice article",
        createdAt: new Date("2024-04-01T00:00:00Z"),
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => newComment,
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Nice article");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByText("Nice article")).toBeInTheDocument();
      });
    });

    it("POSTs to /api/comments with correct payload", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...baseComment, id: 2, authorName: "Bob", content: "Hello" }),
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Hello");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(call[0]).toBe("/api/comments");
        expect(call[1].method).toBe("POST");
        const body = JSON.parse(call[1].body);
        expect(body.postId).toBe(10);
        expect(body.authorName).toBe("Bob");
        expect(body.content).toBe("Hello");
      });
    });

    it("clears form fields after successful submission", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...baseComment, id: 2 }),
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Hello");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Your name")).toHaveValue("");
        expect(screen.getByPlaceholderText("Share your thoughts…")).toHaveValue("");
      });
    });

    it("shows success message after posting", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...baseComment, id: 2 }),
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Hello");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByText("Comment posted successfully.")).toBeInTheDocument();
      });
    });

    it("shows error message on API failure", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Hello");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });

    it("shows fallback error when API omits error field", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      render(<CommentSection postId={10} initialComments={[]} />);
      await user.type(screen.getByPlaceholderText("Your name"), "Bob");
      await user.type(screen.getByPlaceholderText("Share your thoughts…"), "Hello");
      await user.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByText("Failed to post comment")).toBeInTheDocument();
      });
    });
  });
});
