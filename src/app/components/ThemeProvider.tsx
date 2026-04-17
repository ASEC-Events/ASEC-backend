"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  primaryColor: string;
  toggleTheme: () => void;
  setPrimaryColor: (color: string) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [primaryColor, setPrimaryColor] = useState<string>("#3F00FF");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const storedColor = localStorage.getItem("primaryColor");
    
    if (stored === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
    if (storedColor) {
      setPrimaryColor(storedColor);
      document.documentElement.style.setProperty("--primary", storedColor);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const handleSetPrimaryColor = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem("primaryColor", color);
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--primary-hover", color);
  };

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, toggleTheme, setPrimaryColor: handleSetPrimaryColor, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}