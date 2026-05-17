import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ensureParticipant } from "@/lib/participantUtils";
import { toast } from "sonner";

export interface TimelineEntry {
  id: string;
  retro_id: string;
  user_id: string;
  entry_date: string;
  entry_time: string | null;
  description: string;
  created_at: string;
}

export const useTimelineEntries = (retroId: string | undefined) => {
  const {
    data: entries,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<TimelineEntry[]>({
    queryKey: ["timeline_entries", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("timeline_entries")
        .select("*")
        .eq("retro_id", retroId)
        .order("entry_date", { ascending: true })
        .order("entry_time", { ascending: true, nullsFirst: true });
      if (error) throw error;
      return (data ?? []) as unknown as TimelineEntry[];
    },
    enabled: !!retroId,
    staleTime: 15 * 1000,
  });

  return { entries: entries ?? [], loading, error, refetch };
};

export const useCreateTimelineEntry = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      retro_id: string;
      entry_date: string;
      entry_time?: string | null;
      description: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("timeline_entries")
        .insert({
          retro_id: input.retro_id,
          entry_date: input.entry_date,
          entry_time: input.entry_time || null,
          description: input.description,
          user_id: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;
      await ensureParticipant(input.retro_id, user.id);
      return data as unknown as TimelineEntry;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["timeline_entries", vars.retro_id],
      });
      toast.success("Timeline entry added!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useUpdateTimelineEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      retro_id: string;
      description: string;
    }) => {
      const { error } = await supabase
        .from("timeline_entries")
        .update({ description: input.description })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["timeline_entries", vars.retro_id],
      });
      toast.success("Entry updated.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useDeleteTimelineEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string }) => {
      const { error } = await supabase
        .from("timeline_entries")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["timeline_entries", vars.retro_id],
      });
      toast.success("Timeline entry deleted.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
