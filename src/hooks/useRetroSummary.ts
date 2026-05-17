import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RetroSummary {
  overall_sentiment: string;
  key_themes: { title: string; description: string; categories: string[] }[];
  top_highlights: string[];
  top_concerns: string[];
  suggested_actions: { action: string; rationale: string }[];
  one_line_takeaway: string;
}

export const useRetroSummary = (retroId: string | undefined) => {
  const [summary, setSummary] = useState<RetroSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!retroId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("summarize-retro", {
        body: { retroId },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to generate summary");
      }

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("Rate limit reached. Please wait a moment and try again.");
        } else if (data.error.includes("credits")) {
          toast.error("AI quota exceeded. Check the configured provider account.");
        } else {
          toast.error(data.error);
        }
        setError(data.error);
        return;
      }

      setSummary(data.summary);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast.error("Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return { summary, loading, error, generate };
};
