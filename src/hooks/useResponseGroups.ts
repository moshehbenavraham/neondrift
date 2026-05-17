import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ResponseGroup {
  id: string;
  retro_id: string;
  question_id: string;
  name: string;
  created_at: string;
}

export const useResponseGroups = (retroId: string | undefined) => {
  const { data, isLoading, error, refetch } = useQuery<ResponseGroup[]>({
    queryKey: ["response_groups", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("response_groups")
        .select("*")
        .eq("retro_id", retroId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ResponseGroup[];
    },
    enabled: !!retroId,
    staleTime: 15_000,
  });

  return { groups: data ?? [], loading: isLoading, error, refetch };
};

export const useCreateGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { retro_id: string; question_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("response_groups")
        .insert(input)
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as ResponseGroup;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["response_groups", v.retro_id] });
      toast.success("Group created");
    },
    onError: () => toast.error("Failed to create group"),
  });
};

export const useRenameGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string; name: string }) => {
      const { error } = await supabase
        .from("response_groups")
        .update({ name: input.name })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["response_groups", v.retro_id] });
      toast.success("Group renamed");
    },
    onError: () => toast.error("Failed to rename group"),
  });
};

export const useDeleteGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; retro_id: string }) => {
      const { error } = await supabase
        .from("response_groups")
        .delete()
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["response_groups", v.retro_id] });
      qc.invalidateQueries({ queryKey: ["responses", v.retro_id] });
      toast.success("Group deleted; responses ungrouped");
    },
    onError: () => toast.error("Failed to delete group"),
  });
};

export const useMoveToGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { responseId: string; groupId: string | null; retroId: string }) => {
      const { error } = await supabase
        .from("responses")
        .update({ group_id: input.groupId } as any)
        .eq("id", input.responseId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["responses", v.retroId] });
    },
    onError: () => toast.error("Failed to move response"),
  });
};

export const useAutoGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { retroId: string; questionId: string }) => {
      const { data, error } = await supabase.functions.invoke("group-responses", {
        body: { retroId: input.retroId, questionId: input.questionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["response_groups", v.retroId] });
      qc.invalidateQueries({ queryKey: ["responses", v.retroId] });
      toast.success("Responses grouped by theme");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to auto-group responses");
    },
  });
};
