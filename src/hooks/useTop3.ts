import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Top3Category = "do_again" | "do_differently";

export interface Top3Entry {
  id: string;
  retro_id: string;
  user_id: string;
  type: Top3Category;
  rank: number;
  text: string;
  created_at: string;
}

export interface Top3ByUser {
  userId: string;
  do_again: Top3Entry[];
  do_differently: Top3Entry[];
}

export const useTop3 = (retroId: string | undefined) => {
  const { user } = useAuth();

  const {
    data: entries,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Top3Entry[]>({
    queryKey: ["top3", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("top3_entries")
        .select("*")
        .eq("retro_id", retroId)
        .order("rank", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Top3Entry[];
    },
    enabled: !!retroId,
    staleTime: 15 * 1000,
  });

  const byUser: Top3ByUser[] = [];
  const userMap = new Map<string, Top3ByUser>();
  for (const entry of entries ?? []) {
    let group = userMap.get(entry.user_id);
    if (!group) {
      group = {
        userId: entry.user_id,
        do_again: [],
        do_differently: [],
      };
      userMap.set(entry.user_id, group);
      byUser.push(group);
    }
    if (entry.type === "do_again") group.do_again.push(entry);
    else group.do_differently.push(entry);
  }

  const myEntries = (entries ?? []).filter((e) => e.user_id === user?.id);

  return { entries: entries ?? [], byUser, myEntries, loading, error, refetch };
};

export const useSubmitTop3 = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      retroId: string;
      items: { type: Top3Category; rank: number; text: string }[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      await supabase
        .from("top3_entries")
        .delete()
        .eq("retro_id", input.retroId)
        .eq("user_id", user.id);

      const rows = input.items
        .filter((i) => i.text.trim())
        .map((i) => ({
          retro_id: input.retroId,
          user_id: user.id,
          type: i.type,
          rank: i.rank,
          text: i.text.trim(),
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("top3_entries").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["top3", vars.retroId] });
      toast.success("Top 3 saved!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
