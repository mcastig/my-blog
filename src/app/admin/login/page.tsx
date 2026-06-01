"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-[var(--color-background)] px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Sign in to manage your blog</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="px-3 py-2 text-sm border border-[var(--color-border)] bg-[var(--color-background)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)]"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2.5 px-4 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
