import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostForm } from "./PostForm";
import type { Post, Category } from "@/lib/db/schema";

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-preview">{children}</div>,
}));
vi.mock("remark-gfm", () => ({ default: () => {} }));

const mockPush = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: mockBack }),
  usePathname: () => "/admin/posts/new",
}));

const categories: Category[] = [
  { id: 1, name: "Technology", slug: "technology", createdAt: new Date() },
  { id: 2, name: "Science", slug: "science", createdAt: new Date() },
];

const existingPost: Post = {
  id: 10,
  title: "Existing Post",
  slug: "existing-post",
  content: "Some content",
  excerpt: "A short excerpt",
  author: "Jane Doe",
  categoryId: 1,
  featuredImage: null,
  status: "published",
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
};

describe("PostForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockRefresh.mockClear();
  });

  describe("create mode (no post prop)", () => {
    it("renders with empty fields", () => {
      render(<PostForm categories={categories} />);
      expect(screen.getByPlaceholderText("Post title")).toHaveValue("");
      expect(screen.getByPlaceholderText("friendly-url-slug")).toHaveValue("");
    });

    it("shows Save draft and Publish buttons", () => {
      render(<PostForm categories={categories} />);
      expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    });

    it("shows Cancel button", () => {
      render(<PostForm categories={categories} />);
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });
  });

  describe("edit mode (post prop)", () => {
    it("renders with pre-filled fields", () => {
      render(<PostForm categories={categories} post={existingPost} />);
      expect(screen.getByPlaceholderText("Post title")).toHaveValue("Existing Post");
      expect(screen.getByPlaceholderText("friendly-url-slug")).toHaveValue("existing-post");
    });

    it("shows Update & publish button in edit mode when published", () => {
      render(<PostForm categories={categories} post={existingPost} />);
      expect(screen.getByRole("button", { name: "Update & publish" })).toBeInTheDocument();
    });
  });

  describe("title auto-slug", () => {
    it("title change auto-generates slug in create mode", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const titleInput = screen.getByPlaceholderText("Post title");
      await user.type(titleInput, "Hello World");
      expect(screen.getByPlaceholderText("friendly-url-slug")).toHaveValue("hello-world");
    });

    it("title change does NOT auto-generate slug in edit mode when slug already set", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} post={existingPost} />);
      const titleInput = screen.getByPlaceholderText("Post title");
      await user.clear(titleInput);
      await user.type(titleInput, "New Title");
      // Slug should still be existing-post (not changed)
      expect(screen.getByPlaceholderText("friendly-url-slug")).toHaveValue("existing-post");
    });
  });

  describe("preview toggle", () => {
    it("clicking Preview shows markdown preview", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      // Type some content first
      const contentArea = screen.getByPlaceholderText(/Write your post/);
      await user.type(contentArea, "# Test heading");
      await user.click(screen.getByRole("button", { name: "Preview" }));
      expect(screen.getByTestId("markdown-preview")).toBeInTheDocument();
    });

    it("Preview button toggles to Edit", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const contentArea = screen.getByPlaceholderText(/Write your post/);
      await user.type(contentArea, "content");
      await user.click(screen.getByRole("button", { name: "Preview" }));
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    });

    it("shows nothing to preview message when content is empty", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      await user.click(screen.getByRole("button", { name: "Preview" }));
      expect(screen.getByText("Nothing to preview yet.")).toBeInTheDocument();
    });
  });

  describe("saving", () => {
    it("Save as draft calls POST /api/posts in create mode", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      });
      render(<PostForm categories={categories} />);
      await user.type(screen.getByPlaceholderText("Post title"), "My Post");
      await user.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/posts",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("Save as draft calls PUT /api/posts/:id in edit mode", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 10 }),
      });
      render(<PostForm categories={categories} post={existingPost} />);
      await user.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/posts/10",
          expect.objectContaining({ method: "PUT" })
        );
      });
    });

    it("Publish calls with status=published", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      });
      render(<PostForm categories={categories} />);
      const titleInput = screen.getByPlaceholderText("Post title");
      const contentArea = screen.getByPlaceholderText(/Write your post/);
      await user.type(titleInput, "My Post");
      await user.type(contentArea, "Some content here");
      await user.click(screen.getByRole("button", { name: "Publish" }));
      await waitFor(() => {
        const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(call[1].body);
        expect(body.status).toBe("published");
      });
    });

    it("shows error on API failure", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Validation failed" }),
      });
      render(<PostForm categories={categories} />);
      await user.type(screen.getByPlaceholderText("Post title"), "My Post");
      await user.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() => {
        expect(screen.getByText("Validation failed")).toBeInTheDocument();
      });
    });

    it("shows fallback error message when server omits error field", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
      render(<PostForm categories={categories} />);
      await user.type(screen.getByPlaceholderText("Post title"), "My Post");
      await user.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });

    it("navigates to /admin after successful save", async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      });
      render(<PostForm categories={categories} />);
      await user.type(screen.getByPlaceholderText("Post title"), "My Post");
      await user.click(screen.getByRole("button", { name: "Save draft" }));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin");
      });
    });
  });

  describe("image upload", () => {
    it("image upload: selecting file calls POST /api/upload and sets featuredImage", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ url: "/uploads/test.jpg" }),
      });
      render(<PostForm categories={categories} />);
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/upload", expect.objectContaining({ method: "POST" }));
        expect(screen.getByPlaceholderText(/\/uploads\/image/)).toHaveValue("/uploads/test.jpg");
      });
    });

    it("shows Uploading… on the button while upload is in progress", async () => {
      let resolveUpload!: () => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveUpload = () => resolve({ ok: true, json: async () => ({ url: "/uploads/t.jpg" }) } as Response);
        })
      );
      render(<PostForm categories={categories} />);
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      const file = new File(["img"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText("Uploading…")).toBeInTheDocument();
      });
      resolveUpload();
    });

    it("image upload failure shows error", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
      render(<PostForm categories={categories} />);
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      const file = new File(["img"], "fail.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText("Image upload failed")).toBeInTheDocument();
      });
    });
  });

  describe("category select", () => {
    it("category select updates categoryId", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "1");
      expect(select).toHaveValue("1");
    });

    it("renders all category options plus No category", () => {
      render(<PostForm categories={categories} />);
      const select = screen.getByRole("combobox");
      expect(select).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "No category" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Technology" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Science" })).toBeInTheDocument();
    });
  });

  describe("Cancel button", () => {
    it("clicking Cancel calls router.back()", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("slug manual edit", () => {
    it("manually editing slug updates slug field with slugified value", () => {
      render(<PostForm categories={categories} />);
      const slugInput = screen.getByPlaceholderText("friendly-url-slug");
      fireEvent.change(slugInput, { target: { value: "My Custom Slug" } });
      // slugify converts to lower-kebab
      expect(slugInput).toHaveValue("my-custom-slug");
    });
  });

  describe("featured image URL input", () => {
    it("typing in featured image URL field updates it", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const imgInput = screen.getByPlaceholderText(/\/uploads\/image/);
      await user.type(imgInput, "/uploads/cover.jpg");
      expect(imgInput).toHaveValue("/uploads/cover.jpg");
    });

    it("shows image preview when featuredImage is set", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const imgInput = screen.getByPlaceholderText(/\/uploads\/image/);
      await user.type(imgInput, "/uploads/photo.jpg");
      const preview = document.querySelector("img[alt='Preview']");
      expect(preview).toBeInTheDocument();
    });
  });

  describe("author field", () => {
    it("typing in author updates the field", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const authorField = screen.getByPlaceholderText("Author name");
      await user.type(authorField, "John Smith");
      expect(authorField).toHaveValue("John Smith");
    });

    it("renders with pre-filled author in edit mode", () => {
      render(<PostForm categories={categories} post={existingPost} />);
      expect(screen.getByPlaceholderText("Author name")).toHaveValue("Jane Doe");
    });
  });

  describe("excerpt field", () => {
    it("typing in excerpt updates the field", async () => {
      const user = userEvent.setup();
      render(<PostForm categories={categories} />);
      const excerptField = screen.getByPlaceholderText(/Short summary/);
      await user.type(excerptField, "My excerpt");
      expect(excerptField).toHaveValue("My excerpt");
    });
  });

  describe("upload file button", () => {
    it("clicking Upload file button triggers the hidden file input click", () => {
      render(<PostForm categories={categories} />);
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, "click").mockImplementation(() => {});
      fireEvent.click(screen.getByRole("button", { name: "Upload file" }));
      expect(clickSpy).toHaveBeenCalled();
    });

    it("file input change with no file selected does not upload", () => {
      render(<PostForm categories={categories} />);
      const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;
      fireEvent.change(fileInput, { target: { files: [] } });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
