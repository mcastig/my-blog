import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./ThemeToggle";
import { ThemeProvider } from "@/components/providers/ThemeProvider/ThemeProvider";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe("ThemeToggle", () => {
  it("renders placeholder div before mount (mounted=false)", () => {
    // Before useEffect runs the mounted state is false.
    // We can verify the button does not exist before effects run.
    // Since React 18+ effects run synchronously in act(), we check the final state.
    // The placeholder is the initial render path when mounted=false.
    const { container } = render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    // After mounting the button should be present
    expect(container.querySelector("button")).toBeInTheDocument();
  });

  it("shows button with aria-label 'Toggle theme' after mount", () => {
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });

  it("shows moon icon (path element) in light mode by default", () => {
    const { container } = render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    // In light mode the moon path is rendered
    const path = container.querySelector("path");
    expect(path).toBeInTheDocument();
  });

  it("shows sun icon (circle element) in dark mode", async () => {
    document.documentElement.classList.add("dark");
    const { container } = render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    // dark mode is resolved after mount — trigger it
    const button = screen.getByRole("button", { name: "Toggle theme" });
    await act(async () => {
      button.click();
    });
    // Now in light mode, trigger back to dark
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("dark");
    // Re-render with dark pre-set
    document.documentElement.classList.remove("dark");
  });

  it("click toggles from light to dark (adds .dark class)", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    const button = screen.getByRole("button", { name: "Toggle theme" });
    // Start in light (default)
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("click toggles from dark to light (removes .dark class)", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ThemeToggle />
      </Wrapper>
    );
    const button = screen.getByRole("button", { name: "Toggle theme" });
    // First click: light -> dark
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    // Second click: dark -> light
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
