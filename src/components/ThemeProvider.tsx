"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const DARK_VARS = `
  --background: #1A1A1A;
  --background-alt: #252525;
  --background-dark: #0F0F0F;
  --foreground: #FAF8F5;
  --foreground-light: #FAF8F5;
  --muted: #A89F97;
  --muted-light: #6B6560;
  --accent: #D4891A;
  --accent-hover: #B8710E;
  --accent-subtle: rgba(212, 137, 26, 0.08);
  --border: #333333;
  --border-light: rgba(250, 248, 245, 0.12);
  --error: #E05555;
  --success: #3DA06A;
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      applyTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = prefersDark ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      injectDarkStyles();
    } else {
      root.classList.remove("dark");
      removeDarkStyles();
    }
  };

  const injectDarkStyles = () => {
    let styleEl = document.getElementById("dark-mode-vars");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dark-mode-vars";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `html.dark { ${DARK_VARS} }`;
  };

  const removeDarkStyles = () => {
    const styleEl = document.getElementById("dark-mode-vars");
    if (styleEl) styleEl.remove();
  };

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      applyTheme(next);
      return next;
    });
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
