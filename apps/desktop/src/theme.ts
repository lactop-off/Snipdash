import type { Theme } from "@snipdash/sdk";

/** Apply the theme to the document root (CSS variables react to `data-theme`). */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.setAttribute("data-theme", resolved);
}
