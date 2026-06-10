import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "./ConfirmModal";

describe("ConfirmModal", () => {
  const defaultProps = {
    title: "Are you sure?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders title", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<ConfirmModal {...defaultProps} description="This cannot be undone." />);
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("omits description when not provided", () => {
    render(<ConfirmModal {...defaultProps} />);
    // No paragraph element with description
    expect(screen.queryByText(/This cannot/)).toBeNull();
  });

  it("uses custom confirmLabel", () => {
    render(<ConfirmModal {...defaultProps} confirmLabel="Delete forever" />);
    expect(screen.getByRole("button", { name: "Delete forever" })).toBeInTheDocument();
  });

  it("default confirmLabel is Confirm", () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop clicked", () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
    // Portal renders outside container — query document.body
    const backdrop = document.body.querySelector(".absolute.inset-0");
    fireEvent.click(backdrop!);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("confirm button is disabled and shows '…' when loading=true", () => {
    render(<ConfirmModal {...defaultProps} loading />);
    const confirmBtn = screen.getByText("…");
    expect(confirmBtn).toBeDisabled();
  });

  it("cancel button is disabled when loading=true", () => {
    render(<ConfirmModal {...defaultProps} loading />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
