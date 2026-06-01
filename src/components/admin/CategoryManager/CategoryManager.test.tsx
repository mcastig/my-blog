import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryManager } from "./CategoryManager";
import type { Category } from "@/lib/db/schema";

type CategoryWithCount = Category & { postCount: number };

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
  usePathname: () => "/admin/categories",
}));

const sampleCategories: CategoryWithCount[] = [
  { id: 1, name: "Technology", slug: "technology", createdAt: new Date(), postCount: 5 },
  { id: 2, name: "Science", slug: "science", createdAt: new Date(), postCount: 2 },
];

describe("CategoryManager", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it("renders empty state when no categories", () => {
    render(<CategoryManager initialCategories={[]} />);
    expect(screen.getByText("No categories yet. Add one above.")).toBeInTheDocument();
  });

  it("renders category rows", () => {
    render(<CategoryManager initialCategories={sampleCategories} />);
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
  });

  it("clicking Edit enters inline edit mode", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    // The input should be visible with the category name
    expect(screen.getByDisplayValue("Technology")).toBeInTheDocument();
  });

  it("clicking Cancel during inline edit closes the edit form", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    expect(screen.getByDisplayValue("Technology")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByDisplayValue("Technology")).toBeNull();
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("pressing Escape cancels inline edit", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    const input = screen.getByDisplayValue("Technology");
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Technology")).toBeNull();
    });
  });

  it("pressing Enter saves edit", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: "Tech Updated", slug: "tech-updated", createdAt: new Date().toISOString() }),
    });
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    const input = screen.getByDisplayValue("Technology");
    await user.clear(input);
    await user.type(input, "Tech Updated");
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/1", expect.objectContaining({ method: "PUT" }));
    });
  });

  it("save edit calls PUT /api/categories/:id and updates list", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: "Tech Updated", slug: "tech-updated", createdAt: new Date().toISOString() }),
    });
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Tech Updated")).toBeInTheDocument();
    });
  });

  it("save edit shows error on failure", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Duplicate name" }),
    });
    render(<CategoryManager initialCategories={sampleCategories} />);
    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Duplicate name")).toBeInTheDocument();
    });
  });

  it("add form submits POST /api/categories and adds to list", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 3, name: "History", slug: "history", createdAt: new Date().toISOString() }),
    });
    render(<CategoryManager initialCategories={sampleCategories} />);
    const input = screen.getByPlaceholderText("Category name");
    await user.type(input, "History");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories", expect.objectContaining({ method: "POST" }));
      expect(screen.getByText("History")).toBeInTheDocument();
    });
  });

  it("add form shows error on failure", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Already exists" }),
    });
    render(<CategoryManager initialCategories={[]} />);
    const input = screen.getByPlaceholderText("Category name");
    await user.type(input, "Technology");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await waitFor(() => {
      expect(screen.getByText("Already exists")).toBeInTheDocument();
    });
  });

  it("clicking Delete shows ConfirmModal with category name", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);
    expect(screen.getByText("Delete category")).toBeInTheDocument();
    expect(screen.getAllByText(/Technology/).length).toBeGreaterThan(0);
  });

  it("Cancel on ConfirmModal dismisses it", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Delete category")).toBeNull();
    });
  });

  it("Confirm on ConfirmModal calls DELETE /api/categories/:id and removes row", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<CategoryManager initialCategories={sampleCategories} />);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]); // delete Technology (id=1)
    // Find the confirm button in the modal (the red Delete button)
    const confirmDeleteBtns = screen.getAllByRole("button", { name: "Delete" });
    await user.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/categories/1", { method: "DELETE" });
      expect(screen.queryByText("Technology")).toBeNull();
    });
  });

  it("handleAdd guard: does not fetch when name is empty or whitespace", () => {
    render(<CategoryManager initialCategories={[]} />);
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("add form shows fallback error message when server omits error field", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    render(<CategoryManager initialCategories={[]} />);
    await user.type(screen.getByPlaceholderText("Category name"), "Test");
    await user.click(screen.getByRole("button", { name: "Add category" }));
    await waitFor(() => {
      expect(screen.getByText("Failed to create")).toBeInTheDocument();
    });
  });

  it("handleSaveEdit guard: does not fetch when edit name is empty", async () => {
    const user = userEvent.setup();
    render(<CategoryManager initialCategories={sampleCategories} />);
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.clear(screen.getByDisplayValue("Technology"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("save edit shows fallback error message when server omits error field", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    render(<CategoryManager initialCategories={sampleCategories} />);
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Failed to save")).toBeInTheDocument();
    });
  });
});
