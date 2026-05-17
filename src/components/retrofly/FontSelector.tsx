import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type } from "lucide-react";

const FONTS = [
  { value: "dm-sans", label: "DM Sans", family: "'DM Sans', ui-sans-serif, system-ui, sans-serif" },
  { value: "inter", label: "Inter", family: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { value: "system", label: "System", family: "ui-sans-serif, system-ui, -apple-system, sans-serif" },
  { value: "source-serif", label: "Source Serif", family: "'Source Serif 4', Georgia, serif" },
  { value: "ibm-plex", label: "IBM Plex Sans", family: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" },
  { value: "libre-franklin", label: "Libre Franklin", family: "'Libre Franklin', ui-sans-serif, system-ui, sans-serif" },
  { value: "work-sans", label: "Work Sans", family: "'Work Sans', ui-sans-serif, system-ui, sans-serif" },
  { value: "nunito-sans", label: "Nunito Sans", family: "'Nunito Sans', ui-sans-serif, system-ui, sans-serif" },
  { value: "jetbrains", label: "JetBrains Mono", family: "'JetBrains Mono', ui-monospace, monospace" },
  { value: "lora", label: "Lora", family: "'Lora', Georgia, serif" },
];

const FONT_URLS: Record<string, string> = {
  "dm-sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "source-serif": "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap",
  "ibm-plex": "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
  "libre-franklin": "https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700&display=swap",
  "work-sans": "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap",
  "nunito-sans": "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap",
  jetbrains: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
  lora: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
};

const FontSelector = () => {
  const [font, setFont] = useState(() => localStorage.getItem("retrofly-font") || "dm-sans");

  useEffect(() => {
    const selected = FONTS.find((f) => f.value === font);
    if (!selected) return;

    // Load Google Font if needed
    const url = FONT_URLS[font];
    if (url) {
      const id = `font-link-${font}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    }

    document.documentElement.style.setProperty("--font-sans", selected.family);
    document.body.style.fontFamily = selected.family;
    localStorage.setItem("retrofly-font", font);
  }, [font]);

  return (
    <div className="flex items-center gap-1.5">
      <Type className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <Select value={font} onValueChange={setFont}>
        <SelectTrigger className="h-7 w-32 rounded-md border-border text-xs bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONTS.map((f) => (
            <SelectItem key={f.value} value={f.value} className="text-xs">
              <span style={{ fontFamily: f.family }}>{f.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FontSelector;
