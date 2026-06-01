/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { signToken, verifyToken, getSession } from "./auth";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("signToken", () => {
  it("produces a non-empty JWT string", async () => {
    const token = await signToken({ userId: 1, username: "admin" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("token is verifiable and returns the original payload", async () => {
    const token = await signToken({ userId: 42, username: "testuser" });
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(42);
    expect(payload?.username).toBe("testuser");
  });
});

describe("verifyToken", () => {
  it("returns payload for valid token", async () => {
    const token = await signToken({ userId: 5, username: "jane" });
    const payload = await verifyToken(token);
    expect(payload).toMatchObject({ userId: 5, username: "jane" });
  });

  it("returns null for invalid token", async () => {
    const result = await verifyToken("invalid.token.value");
    expect(result).toBeNull();
  });

  it("returns null for empty string", async () => {
    const result = await verifyToken("");
    expect(result).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken({ userId: 1, username: "admin" });
    const parts = token.split(".");
    parts[1] = Buffer.from(JSON.stringify({ userId: 999, username: "hacker" })).toString("base64url");
    const tampered = parts.join(".");
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });
});

describe("getSession", () => {
  it("returns null when cookie is missing", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as never);

    const session = await getSession();
    expect(session).toBeNull();
  });

  it("returns payload when valid cookie is present", async () => {
    const token = await signToken({ userId: 7, username: "cookieuser" });
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    } as never);

    const session = await getSession();
    expect(session).toMatchObject({ userId: 7, username: "cookieuser" });
  });

  it("returns null when cookie contains invalid token", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "bad-token" }),
    } as never);

    const session = await getSession();
    expect(session).toBeNull();
  });
});
