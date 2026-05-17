import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RetroParticipant {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const useRetroParticipants = (retroId: string | undefined) => {
  const {
    data: participants,
    isLoading: loading,
    error,
  } = useQuery<RetroParticipant[]>({
    queryKey: ["retro_participants", retroId],
    queryFn: async () => {
      if (!retroId) return [];

      // Get participant user_ids
      const { data: pRows, error: pError } = await (supabase as any)
        .from("retro_participants")
        .select("user_id")
        .eq("retro_id", retroId);

      if (pError) throw pError;
      if (!pRows || pRows.length === 0) return [];

      const userIds = pRows.map((p: any) => p.user_id);

      // Get profiles
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      if (profError) throw profError;

      return (profiles ?? []).map((p) => ({
        user_id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }));
    },
    enabled: !!retroId,
    staleTime: 30 * 1000,
  });

  return { participants: participants ?? [], loading, error };
};
