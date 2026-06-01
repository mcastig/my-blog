import "@testing-library/jest-dom";
import React from "react";
import { vi, beforeEach, afterEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
}));

// Mock next/image as plain <img>
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    loading,
    priority,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    loading?: string;
    priority?: boolean;
  }) =>
    React.createElement("img", {
      src,
      alt,
      width,
      height,
      loading: loading ?? (priority ? "eager" : "lazy"),
    }),
}));

// Mock next/link as plain <a>
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    className,
    style,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) =>
    React.createElement(
      "a",
      { href, onClick, className, style, ...rest },
      children
    ),
}));

// Mock window.matchMedia (only in browser-like environments)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

beforeEach(() => {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove("dark");
  }
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});
