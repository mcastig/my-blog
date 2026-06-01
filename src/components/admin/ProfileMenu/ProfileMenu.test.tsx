import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileMenu } from "./ProfileMenu";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: vi.fn() }),
  usePathname: () => "/admin",
}));

function renderMenu(props: Partial<React.ComponentProps<typeof ProfileMenu>> = {}) {
  return render(
    <ProfileMenu
      username="admin"
      firstName={null}
      lastName={null}
      {...props}
    />
  );
}

async function openDropdown(user: ReturnType<typeof userEvent.setup>) {
  // The trigger button text matches the displayName or contains avatar initial
  const btn = screen.getAllByRole("button")[0];
  await user.click(btn);
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("renders avatar with first letter of username", () => {
    renderMenu({ username: "admin" });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows username when no first/last name", () => {
    renderMenu({ username: "admin" });
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("shows full name when first and last name provided", () => {
    renderMenu({ username: "admin", firstName: "John", lastName: "Doe" });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows first name when only first name provided", () => {
    renderMenu({ username: "admin", firstName: "Jane", lastName: null });
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("avatar initial uses full name first letter when provided", () => {
    renderMenu({ username: "admin", firstName: "John", lastName: "Doe" });
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("clicking button opens dropdown", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    expect(screen.getByText("Change password")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("clicking outside closes dropdown", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    expect(screen.getByText("Edit profile")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Edit profile")).toBeNull();
    });
  });

  it("Edit profile opens profile modal", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    expect(screen.getByText("Edit profile", { selector: "h2" })).toBeInTheDocument();
  });

  it("Change password opens password modal", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));
    expect(screen.getByText("Change password", { selector: "h2" })).toBeInTheDocument();
  });

  it("Sign out opens sign out confirm modal", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Sign out"));
    expect(screen.getByText("Sign out", { selector: "h2" })).toBeInTheDocument();
  });

  it("profile modal shows disabled username field", async () => {
    const user = userEvent.setup();
    renderMenu({ username: "admin" });
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    const usernameInput = screen.getByDisplayValue("admin");
    expect(usernameInput).toBeDisabled();
  });

  it("profile form submits PATCH /api/auth/profile and shows success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderMenu({ username: "admin", firstName: "Jane", lastName: null });
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully.")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/profile",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("profile form shows error from server", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Profile error" }),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Profile error")).toBeInTheDocument();
    });
  });

  it("profile form shows fallback error when server omits error field", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("password modal: mismatched passwords shows error", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));

    // Get all password inputs in order
    const pwInputs = document.querySelectorAll("input[type='password']");
    fireEvent.change(pwInputs[0], { target: { value: "oldpass" } });
    fireEvent.change(pwInputs[1], { target: { value: "newpass1" } });
    fireEvent.change(pwInputs[2], { target: { value: "newpass2" } }); // mismatch

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(screen.getByText("New passwords do not match")).toBeInTheDocument();
  });

  it("password modal submits PATCH /api/auth/password and shows success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));

    const pwInputs = document.querySelectorAll("input[type='password']");
    fireEvent.change(pwInputs[0], { target: { value: "oldpass" } });
    fireEvent.change(pwInputs[1], { target: { value: "newpass123" } });
    fireEvent.change(pwInputs[2], { target: { value: "newpass123" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Password updated successfully.")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/password",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("password modal shows server error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Wrong current password" }),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));

    const pwInputs = document.querySelectorAll("input[type='password']");
    fireEvent.change(pwInputs[0], { target: { value: "wrong" } });
    fireEvent.change(pwInputs[1], { target: { value: "newpass123" } });
    fireEvent.change(pwInputs[2], { target: { value: "newpass123" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Wrong current password")).toBeInTheDocument();
    });
  });

  it("password modal shows fallback error when server omits error field", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));

    const pwInputs = document.querySelectorAll("input[type='password']");
    fireEvent.change(pwInputs[0], { target: { value: "oldpass" } });
    fireEvent.change(pwInputs[1], { target: { value: "newpass123" } });
    fireEvent.change(pwInputs[2], { target: { value: "newpass123" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("sign out confirm onConfirm calls /api/auth/logout then router.push", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Sign out"));
    // Find confirm button in modal — the ConfirmModal "Sign out" button
    // The ConfirmModal renders with confirmLabel="Sign out"
    const signOutBtns = screen.getAllByRole("button", { name: "Sign out" });
    // Last one is the confirm button in ConfirmModal
    await user.click(signOutBtns[signOutBtns.length - 1]);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });

  it("closing profile modal via cancel button works", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    expect(screen.getByText("Edit profile", { selector: "h2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Edit profile", { selector: "h2" })).toBeNull();
    });
  });

  it("closing password modal via cancel button works", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));
    expect(screen.getByText("Change password", { selector: "h2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Change password", { selector: "h2" })).toBeNull();
    });
  });

  it("typing in firstName and lastName fields updates values", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderMenu({ username: "admin", firstName: "Jane", lastName: "Smith" });
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    const firstInput = screen.getByDisplayValue("Jane");
    const lastInput = screen.getByDisplayValue("Smith");
    await user.clear(firstInput);
    await user.type(firstInput, "Alice");
    await user.clear(lastInput);
    await user.type(lastInput, "Brown");
    expect(firstInput).toHaveValue("Alice");
    expect(lastInput).toHaveValue("Brown");
  });

  it("sign out confirm shows loading state while signing out", async () => {
    let resolveFetch!: () => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({ ok: true, json: async () => ({}) } as Response);
      })
    );
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Sign out"));
    const signOutBtns = screen.getAllByRole("button", { name: "Sign out" });
    await user.click(signOutBtns[signOutBtns.length - 1]);
    expect(screen.getByRole("button", { name: "…" })).toBeInTheDocument();
    resolveFetch();
  });

  it("profile success Close button closes the modal", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderMenu({ username: "admin", firstName: "Jane", lastName: null });
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully.")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByText("Profile updated successfully.")).toBeNull();
    });
  });

  it("password success Close button closes the modal", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));

    const pwInputs = document.querySelectorAll("input[type='password']");
    fireEvent.change(pwInputs[0], { target: { value: "oldpass" } });
    fireEvent.change(pwInputs[1], { target: { value: "newpass123" } });
    fireEvent.change(pwInputs[2], { target: { value: "newpass123" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Password updated successfully.")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByText("Password updated successfully.")).toBeNull();
    });
  });

  it("clicking backdrop of profile modal closes it", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Edit profile"));
    expect(screen.getByText("Edit profile", { selector: "h2" })).toBeInTheDocument();
    const backdrop = document.querySelector('div[class*="bg-black"]') as HTMLElement;
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(screen.queryByText("Edit profile", { selector: "h2" })).toBeNull();
    });
  });

  it("canceling sign out confirm modal closes it", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Sign out"));
    expect(screen.getByText("Sign out", { selector: "h2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText("Sign out", { selector: "h2" })).toBeNull();
    });
  });

  it("clicking backdrop of password modal closes it", async () => {
    const user = userEvent.setup();
    renderMenu();
    await openDropdown(user);
    await user.click(screen.getByText("Change password"));
    expect(screen.getByText("Change password", { selector: "h2" })).toBeInTheDocument();
    const backdrop = document.querySelector('div[class*="bg-black"]') as HTMLElement;
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(screen.queryByText("Change password", { selector: "h2" })).toBeNull();
    });
  });
});
