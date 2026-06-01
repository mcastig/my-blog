"use client";

import { useRef, useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type Props = {
  username: string;
  firstName: string | null;
  lastName: string | null;
};

type Modal = "none" | "profile" | "password" | "signout";

export function ProfileMenu({ username, firstName: initialFirst, lastName: initialLast }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<Modal>("none");
  const menuRef = useRef<HTMLDivElement>(null);

  // profile state
  const [firstName, setFirstName] = useState(initialFirst ?? "");
  const [lastName, setLastName] = useState(initialLast ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function openModal(m: Modal) {
    setOpen(false);
    setProfileError("");
    setProfileSuccess(false);
    setPasswordError("");
    setPasswordSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setModal(m);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileLoading(true);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: firstName.trim() || null, lastName: lastName.trim() || null }),
    });
    const json = await res.json();
    setProfileLoading(false);
    if (!res.ok) {
      setProfileError(json.error ?? "Something went wrong");
    } else {
      setProfileSuccess(true);
      router.refresh();
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirm) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    setPasswordLoading(false);
    if (!res.ok) {
      setPasswordError(json.error ?? "Something went wrong");
    } else {
      setPasswordSuccess(true);
    }
  }

  const displayName =
    firstName || lastName ? [firstName, lastName].filter(Boolean).join(" ") : username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--color-surface)] transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-[var(--color-foreground)] text-[var(--color-background)] flex items-center justify-center text-xs font-bold select-none">
            {initial}
          </span>
          <span className="text-sm font-medium hidden sm:block">{displayName}</span>
          <svg
            className={`w-3.5 h-3.5 text-[var(--color-muted)] transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-1.5 w-48 bg-[var(--color-background)] border border-[var(--color-border)] rounded shadow-lg z-50 py-1">
            <button
              onClick={() => openModal("profile")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface)] transition-colors"
            >
              Edit profile
            </button>
            <button
              onClick={() => openModal("password")}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface)] transition-colors"
            >
              Change password
            </button>
            <hr className="my-1 border-[var(--color-border)]" />
            <button
              onClick={() => openModal("signout")}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--color-surface)] transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Edit profile modal */}
      {modal === "profile" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal("none")} />
          <div className="relative bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold tracking-tight mb-5">Edit profile</h2>
            {profileSuccess ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-green-600">Profile updated successfully.</p>
                <button
                  onClick={() => setModal("none")}
                  className="py-2 px-4 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded hover:opacity-80 transition-opacity"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] rounded cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
                  />
                </div>
                {profileError && <p className="text-sm text-red-500">{profileError}</p>}
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setModal("none")}
                    className="py-2 px-4 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="py-2 px-4 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {profileLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sign out confirm modal */}
      {modal === "signout" && (
        <ConfirmModal
          title="Sign out"
          description="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          loading={signingOut}
          onConfirm={logout}
          onCancel={() => setModal("none")}
        />
      )}

      {/* Change password modal */}
      {modal === "password" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal("none")} />
          <div className="relative bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold tracking-tight mb-5">Change password</h2>
            {passwordSuccess ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-green-600">Password updated successfully.</p>
                <button
                  onClick={() => setModal("none")}
                  className="py-2 px-4 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded hover:opacity-80 transition-opacity"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Current password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
                  />
                </div>
                {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setModal("none")}
                    className="py-2 px-4 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="py-2 px-4 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {passwordLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
