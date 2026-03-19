"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("pharo-theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pharo-theme", next);
  };

  return (
    <button onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
      style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
      {theme === "light" ? "☀️" : "🌙"} {theme === "light" ? "Light" : "Dark"}
    </button>
  );
}
