import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ensureParticipant } from "@/lib/participantUtils";
import { toast } from "sonner";

export interface Response {
  id: string;
  retro_id: string;
  question_id: string;
  user_id: string;
  text: string;
  sentiment: number | null;
  is_action_item: boolean;
  created_at: string;
  group_id: string | null;
}

export const useResponses = (retroId: string | undefined) => {
  const {
    data: responses,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Response[]>({
    queryKey: ["responses", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("responses")
        .select("*")
        .eq("retro_id", retroId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Response[];
    },
    enabled: !!retroId,
    staleTime: 15 * 1000,
  });

  return { responses: responses ?? [], loading, error, refetch };
};

export const useCreateResponse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      retro_id: string;
      question_id: string;
      text: string;
      sentiment?: number | null;
      is_action_item?: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("responses")
        .insert({
          retro_id: input.retro_id,
          question_id: input.question_id,
          user_id: user.id,
          text: input.text,
          sentiment: input.sentiment ?? null,
          is_action_item: input.is_action_item ?? false,
        })
        .select("*")
        .single();
      if (error) throw error;
      await ensureParticipant(input.retro_id, user.id);

      // Auto-create linked action item when flagged
      if (input.is_action_item) {
        const response = data as unknown as Response;
        await supabase.from("action_items").insert({
          retro_id: input.retro_id,
          response_id: response.id,
          description: input.text,
          created_by: user.id,
        });
      }

      return data as unknown as Response;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["responses", vars.retro_id] });
      if (vars.is_action_item) {
        queryClient.invalidateQueries({ queryKey: ["action_items", vars.retro_id] });
      }
      toast.success("Response added!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useToggleActionFlag = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      retro_id: string;
      text: string;
      is_action_item: boolean; // the NEW value
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update the response flag
      const { error } = await supabase
        .from("responses")
        .update({ is_action_item: input.is_action_item })
        .eq("id", input.id);
      if (error) throw error;

      if (input.is_action_item) {
        // Create linked action item
        await supabase.from("action_items").insert({
          retro_id: input.retro_id,
          response_id: input.id,
          description: input.text,
          created_by: user.id,
        });
      } else {
        // Remove linked action item
        await supabase
          .from("action_items")
          .delete()
          .eq("response_id", input.id);
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["responses", vars.retro_id] });
      queryClient.invalidateQueries({ queryKey: ["action_items", vars.retro_id] });
      toast.success(vars.is_action_item ? "Flagged as action item" : "Action flag removed");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useUpdateResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string; text: string }) => {
      const { error } = await supabase
        .from("responses")
        .update({ text: input.text })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["responses", vars.retro_id] });
      toast.success("Response updated!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useDeleteResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string }) => {
      const { error } = await supabase
        .from("responses")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["responses", vars.retro_id] });
      toast.success("Response deleted.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
