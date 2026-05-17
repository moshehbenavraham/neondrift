import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Comment {
  id: string;
  response_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export const useComments = (responseId: string) => {
  return useQuery({
    queryKey: ["comments", responseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_comments")
        .select("*")
        .eq("response_id", responseId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!responseId,
  });
};

export const useCommentCount = (responseId: string) => {
  return useQuery({
    queryKey: ["comment-count", responseId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("response_comments")
        .select("*", { count: "exact", head: true })
        .eq("response_id", responseId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!responseId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ responseId, text }: { responseId: string; text: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("response_comments")
        .insert({ response_id: responseId, user_id: user.id, text })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.response_id] });
      queryClient.invalidateQueries({ queryKey: ["comment-count", data.response_id] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, responseId }: { id: string; responseId: string }) => {
      const { error } = await supabase
        .from("response_comments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { responseId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.responseId] });
      queryClient.invalidateQueries({ queryKey: ["comment-count", data.responseId] });
    },
  });
};
