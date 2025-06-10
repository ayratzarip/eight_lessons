"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Show static version during SSR and initial render
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 transition-all duration-300"
        disabled
      >
        <Sun className="h-4 w-4" />
        <span className="sr-only">Переключить тему</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 glass-effect hover:ai-glow transition-all duration-300"
    >
      <Sun className={`h-4 w-4 transition-all ${isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      <span className="sr-only">Переключить тему</span>
    </Button>
  );
} 