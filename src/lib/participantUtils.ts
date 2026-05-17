import { supabase } from "@/integrations/supabase/client";

/**
 * Upserts a participant row for the given retro and user.
 * Uses ON CONFLICT DO NOTHING via the Supabase upsert with ignoreDuplicates.
 * Silently swallows errors to avoid disrupting the primary operation.
 */
export const ensureParticipant = async (retroId: string, userId: string) => {
  try {
    await (supabase as any)
      .from("retro_participants")
      .upsert(
        { retro_id: retroId, user_id: userId },
        { onConflict: "retro_id,user_id", ignoreDuplicates: true }
      );
  } catch {
    // Silently ignore — participant tracking is non-critical
  }
};
