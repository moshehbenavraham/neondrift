import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UpvoteInfo {
  response_id: string;
  count: number;
  hasUpvoted: boolean;
}

export const useUpvotes = (retroId: string | undefined) => {
  const { user } = useAuth();

  const {
    data: upvotes,
    isLoading: loading,
    error,
  } = useQuery<UpvoteInfo[]>({
    queryKey: ["upvotes", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      // Fetch all upvotes for responses in this retro
      const { data, error } = await supabase
        .from("response_upvotes")
        .select("response_id, user_id")
        .in(
          "response_id",
          (
            await supabase
              .from("responses")
              .select("id")
              .eq("retro_id", retroId)
          ).data?.map((r) => r.id) ?? []
        );
      if (error) throw error;

      // Group by response_id
      const grouped: Record<string, { count: number; hasUpvoted: boolean }> = {};
      for (const row of data ?? []) {
        if (!grouped[row.response_id]) {
          grouped[row.response_id] = { count: 0, hasUpvoted: false };
        }
        grouped[row.response_id].count++;
        if (row.user_id === user?.id) {
          grouped[row.response_id].hasUpvoted = true;
        }
      }

      return Object.entries(grouped).map(([response_id, info]) => ({
        response_id,
        ...info,
      }));
    },
    enabled: !!retroId,
    staleTime: 10 * 1000,
  });

  const getUpvoteInfo = (responseId: string): UpvoteInfo => {
    const found = upvotes?.find((u) => u.response_id === responseId);
    return found ?? { response_id: responseId, count: 0, hasUpvoted: false };
  };

  return { upvotes: upvotes ?? [], loading, error, getUpvoteInfo };
};

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { responseId: string; retroId: string; hasUpvoted: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (input.hasUpvoted) {
        // Delete upvote
        const { error } = await supabase
          .from("response_upvotes")
          .delete()
          .eq("response_id", input.responseId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Insert upvote — ignore unique violation
        const { error } = await supabase
          .from("response_upvotes")
          .insert({ response_id: input.responseId, user_id: user.id });
        if (error && error.code !== "23505") throw error;
      }
    },
    onMutate: async (input) => {
      const key = ["upvotes", input.retroId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UpvoteInfo[]>(key);

      queryClient.setQueryData<UpvoteInfo[]>(key, (old = []) => {
        const existing = old.find((u) => u.response_id === input.responseId);
        if (existing) {
          return old.map((u) =>
            u.response_id === input.responseId
              ? {
                  ...u,
                  count: input.hasUpvoted ? Math.max(0, u.count - 1) : u.count + 1,
                  hasUpvoted: !input.hasUpvoted,
                }
              : u
          );
        }
        return [
          ...old,
          { response_id: input.responseId, count: 1, hasUpvoted: true },
        ];
      });

      return { previous };
    },
    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["upvotes", input.retroId], context.previous);
      }
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ["upvotes", input.retroId] });
    },
  });
};
