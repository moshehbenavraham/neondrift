import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ensureParticipant } from "@/lib/participantUtils";
import { toast } from "sonner";

export interface RetroQuestion {
  id: string;
  retro_id: string;
  question_text: string;
  sort_order: number;
  created_at: string;
}

export interface Retro {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  team_id: string | null;
  created_by: string;
  status: "open" | "closed";
  format: "simple" | "detailed";
  timeline_start: string | null;
  timeline_end: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string } | null;
  teams: { id: string; name: string } | null;
}

export interface CreateRetroInput {
  title: string;
  description?: string;
  project_id?: string;
  team_id?: string;
  timeline_start?: string;
  timeline_end?: string;
  questions: string[];
  format?: "simple" | "detailed";
}

const SIMPLE_QUESTIONS = ["Start", "Stop", "Continue"];

export const useRetro = (id: string | undefined) => {
  const { data: retro, isLoading: loading, error } = useQuery<Retro | null>({
    queryKey: ["retro", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("retros")
        .select(`
          *,
          projects:project_id (id, name),
          teams:team_id (id, name)
        `)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Retro;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });

  return { retro: retro ?? null, loading, error };
};

export const useRetroQuestions = (retroId: string | undefined) => {
  const { data: questions, isLoading: loading } = useQuery<RetroQuestion[]>({
    queryKey: ["retro-questions", retroId],
    queryFn: async () => {
      if (!retroId) return [];
      const { data, error } = await supabase
        .from("retro_questions")
        .select("*")
        .eq("retro_id", retroId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RetroQuestion[];
    },
    enabled: !!retroId,
    staleTime: 60 * 1000,
  });

  return { questions: questions ?? [], loading };
};

export const useCreateRetro = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateRetroInput) => {
      if (!user) throw new Error("Not authenticated");

      const format = input.format ?? "simple";
      const questions = format === "simple" ? SIMPLE_QUESTIONS : input.questions;

      const { data: retro, error: retroError } = await supabase
        .from("retros")
        .insert({
          title: input.title,
          description: input.description ?? null,
          project_id: input.project_id ?? null,
          team_id: input.team_id ?? null,
          created_by: user.id,
          timeline_start: input.timeline_start ?? null,
          timeline_end: input.timeline_end ?? null,
          format,
        } as any)
        .select()
        .single();
      if (retroError) {
        console.error("Retro insert failed:", retroError);
        throw retroError;
      }

      const questionsToInsert = questions.map((text, idx) => ({
        retro_id: retro.id,
        question_text: text,
        sort_order: idx + 1,
      }));

      const { error: questionsError } = await supabase
        .from("retro_questions")
        .insert(questionsToInsert);
      if (questionsError) {
        console.error("Questions insert failed:", questionsError);
        throw questionsError;
      }

      try {
        await ensureParticipant(retro.id, user.id);
      } catch (e) {
        console.error("ensureParticipant failed:", e);
        throw e;
      }

      return retro;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retro created!");
    },
    onError: (error) => {
      console.error("Create retro failed:", error);
      toast.error("Something went wrong. Please try again.");
    },
  });
};

export const useUpdateRetroDates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      retroId: string;
      timeline_start: string;
      timeline_end: string;
    }) => {
      if (input.timeline_end < input.timeline_start) {
        throw new Error("End date must be on or after start date");
      }
      const { error } = await supabase
        .from("retros")
        .update({
          timeline_start: input.timeline_start,
          timeline_end: input.timeline_end,
        })
        .eq("id", input.retroId);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["retro", vars.retroId] });
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retro dates updated.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update dates.");
    },
  });
};

export const useCloseRetro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (retroId: string) => {
      const { error } = await supabase
        .from("retros")
        .update({ status: "closed" })
        .eq("id", retroId);
      if (error) throw error;
    },
    onSuccess: (_data, retroId) => {
      queryClient.invalidateQueries({ queryKey: ["retro", retroId] });
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retro closed.");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
};
