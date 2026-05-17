import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ActionItem {
  id: string;
  retro_id: string;
  response_id: string | null;
  description: string;
  owner_id: string | null;
  created_by: string;
  due_date: string | null;
  status: "open" | "done";
  created_at: string;
  updated_at: string;
}

export const useActionItems = (retroId: string | undefined) => {
  const {
    data: items,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<ActionItem[]>({
    queryKey: ["action_items", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("action_items")
        .select("*")
        .eq("retro_id", retroId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ActionItem[];
    },
    enabled: !!retroId,
    staleTime: 15 * 1000,
  });

  return { items: items ?? [], loading, error, refetch };
};

export const useCreateActionItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      retro_id: string;
      description: string;
      owner_id?: string | null;
      due_date?: string | null;
      response_id?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("action_items")
        .insert({
          retro_id: input.retro_id,
          description: input.description,
          owner_id: input.owner_id ?? null,
          due_date: input.due_date ?? null,
          response_id: input.response_id ?? null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["action_items", vars.retro_id] });
      toast.success("Action item added!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useUpdateActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      retro_id: string;
      status?: "open" | "done";
      owner_id?: string | null;
      due_date?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (input.status !== undefined) updates.status = input.status;
      if (input.owner_id !== undefined) updates.owner_id = input.owner_id;
      if (input.due_date !== undefined) updates.due_date = input.due_date;
      const { error } = await supabase
        .from("action_items")
        .update(updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["action_items", vars.retro_id] });
      toast.success("Action item updated!");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useDeleteActionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string }) => {
      const { error } = await supabase
        .from("action_items")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["action_items", vars.retro_id] });
      toast.success("Action item deleted.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
