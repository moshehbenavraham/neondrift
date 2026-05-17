import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * App-wide theme provider. Wraps `next-themes` so the `.dark` class is toggled
 * on `<html>` based on the user's stored preference or `prefers-color-scheme`.
 *
 * The matching anti-FOUC bootstrap lives in `index.html` and must read the same
 * storage key (`theme`, the next-themes default) to avoid a hydration flash.
 */
export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    storageKey="theme"
    {...props}
  >
    {children}
  </NextThemesProvider>
);
