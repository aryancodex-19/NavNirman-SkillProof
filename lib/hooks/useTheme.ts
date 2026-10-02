import { useTheme as useNextTheme } from "next-themes";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: theme === "dark" || resolvedTheme === "dark",
    toggleTheme: () => setTheme(theme === "dark" || resolvedTheme === "dark" ? "light" : "dark"),
  };
}
