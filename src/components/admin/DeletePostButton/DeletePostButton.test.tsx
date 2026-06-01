import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeletePostButton } from "./DeletePostButton";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
  usePathname: () => "/admin",
}));

describe("DeletePostButton", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it("renders Delete button with aria-label", () => {
    render(<DeletePostButton id={1} title="My Post" />);
    expect(screen.getByRole("button", { name: /Delete "My Post"/ })).toBeInTheDocument();
  });

  it("clicking Delete opens ConfirmModal with post title in description", async () => {
    const user = userEvent.setup();
    render(<DeletePostButton id={1} title="My Post" />);
    await user.click(screen.getByRole("button", { name: /Delete "My Post"/ }));
    expect(screen.getByText(/My Post/)).toBeInTheDocument();
    expect(screen.getByText("Delete post")).toBeInTheDocument();
  });

  it("ConfirmModal onCancel closes the modal", async () => {
    const user = userEvent.setup();
    render(<DeletePostButton id={1} title="My Post" />);
    await user.click(screen.getByRole("button", { name: /Delete "My Post"/ }));
    // Modal is open
    expect(screen.getByText("Delete post")).toBeInTheDocument();
    // Click cancel
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete post")).toBeNull();
  });

  it("ConfirmModal onConfirm calls fetch DELETE and router.refresh", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    render(<DeletePostButton id={42} title="My Post" />);
    await user.click(screen.getByRole("button", { name: /Delete "My Post"/ }));
    // Confirm button in modal
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(global.fetch).toHaveBeenCalledWith("/api/posts/42", { method: "DELETE" });
    expect(mockRefresh).toHaveBeenCalled();
  });
});
