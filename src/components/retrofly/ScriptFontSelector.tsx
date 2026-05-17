import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brush } from "lucide-react";

const SCRIPT_FONTS = [
  { value: "caveat", label: "Caveat", family: "'Caveat', cursive" },
  { value: "patrick-hand", label: "Patrick Hand", family: "'Patrick Hand', cursive" },
  { value: "kalam", label: "Kalam", family: "'Kalam', cursive" },
  { value: "architects-daughter", label: "Architects Daughter", family: "'Architects Daughter', cursive" },
  { value: "gochi-hand", label: "Gochi Hand", family: "'Gochi Hand', cursive" },
  { value: "shadows-into-light", label: "Shadows Into Light", family: "'Shadows Into Light', cursive" },
  { value: "nanum-pen-script", label: "Nanum Pen Script", family: "'Nanum Pen Script', cursive" },
  { value: "indie-flower", label: "Indie Flower", family: "'Indie Flower', cursive" },
  { value: "sacramento", label: "Sacramento", family: "'Sacramento', cursive" },
  { value: "handlee", label: "Handlee", family: "'Handlee', cursive" },
];

const SCRIPT_FONT_URLS: Record<string, string> = {
  caveat: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap",
  "patrick-hand": "https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap",
  kalam: "https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap",
  "architects-daughter": "https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap",
  "gochi-hand": "https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap",
  "shadows-into-light": "https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap",
  "nanum-pen-script": "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap",
  "indie-flower": "https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap",
  sacramento: "https://fonts.googleapis.com/css2?family=Sacramento&display=swap",
  handlee: "https://fonts.googleapis.com/css2?family=Handlee&display=swap",
};

const ScriptFontSelector = () => {
  const [font, setFont] = useState(() => localStorage.getItem("retrofly-script-font") || "caveat");

  useEffect(() => {
    const selected = SCRIPT_FONTS.find((item) => item.value === font);
    if (!selected) return;

    const url = SCRIPT_FONT_URLS[font];
    if (url) {
      const id = `script-font-link-${font}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
      }
    }

    document.documentElement.style.setProperty("--font-script", selected.family);
    localStorage.setItem("retrofly-script-font", font);
  }, [font]);

  return (
    <div className="flex items-center gap-1.5">
      <Brush className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <Select value={font} onValueChange={setFont}>
        <SelectTrigger className="h-7 w-40 rounded-md border-border text-xs bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCRIPT_FONTS.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-xs">
              <span style={{ fontFamily: item.family }}>{item.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ScriptFontSelector;