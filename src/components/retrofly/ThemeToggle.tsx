import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Variant = "icon" | "ghost";

interface ThemeToggleProps {
  /** Visual variant. "icon" matches the avatar-sized trigger in the top nav. */
  variant?: Variant;
  /** Optional extra classes applied to the trigger button. */
  className?: string;
}

/**
 * Three-way theme switcher (Light / Dark / System). Rendered as a dropdown so
 * the active mode is always discoverable and the System option is reachable.
 *
 * Returns a stable placeholder before mount to keep server-rendered markup and
 * the first client render aligned (prevents the icon from flipping after
 * hydration when the user prefers dark mode).
 */
const ThemeToggle = ({ variant = "icon", className = "" }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses =
    variant === "icon"
      ? "h-7 w-7 rounded-full"
      : "h-9 w-9 rounded-md";

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={`${sizeClasses} ${className}`.trim()}
        // Render a placeholder to reserve layout space without leaking the
        // server-side theme assumption to the user.
      >
        <span className="sr-only">Toggle theme</span>
        <Sun className="h-3.5 w-3.5 opacity-0" aria-hidden="true" />
      </Button>
    );
  }

  const active = (theme ?? "system") as "light" | "dark" | "system";
  const effective = resolvedTheme === "dark" ? "dark" : "light";

  const ActiveIcon =
    active === "system" ? Monitor : effective === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${active}. Change theme.`}
          className={`${sizeClasses} text-muted-foreground hover:text-foreground ${className}`.trim()}
        >
          <ActiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-checked={active === "light"}
          role="menuitemradio"
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
          Light
          {active === "light" && (
            <span className="ml-auto text-xs text-muted-foreground">●</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-checked={active === "dark"}
          role="menuitemradio"
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
          Dark
          {active === "dark" && (
            <span className="ml-auto text-xs text-muted-foreground">●</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-checked={active === "system"}
          role="menuitemradio"
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />
          System
          {active === "system" && (
            <span className="ml-auto text-xs text-muted-foreground">●</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
