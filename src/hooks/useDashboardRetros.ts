import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardRetro {
  id: string;
  title: string;
  status: "open" | "closed";
  format: "simple" | "detailed";
  created_at: string;
  project_name: string | null;
  team_name: string | null;
  participant_count: number;
}

export interface DashboardFilters {
  search?: string;
  projectId?: string;
  teamId?: string;
  status?: "open" | "closed" | "all";
  sort?: "newest" | "oldest" | "az" | "za";
}

export const useDashboardRetros = (filters: DashboardFilters = {}) => {
  const { user } = useAuth();
  const { search, projectId, teamId, status = "open", sort = "newest" } = filters;

  const {
    data: retros,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<DashboardRetro[]>({
    queryKey: ["dashboard_retros", user?.id, search, projectId, teamId, status, sort],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("retros")
        .select(
          "id, title, status, format, created_at, projects:project_id (name), teams:team_id (name)"
        )
        ;

      if (status === "open" || status === "closed") {
        query = query.eq("status", status);
      }

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      // Sort
      if (sort === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sort === "az") {
        query = query.order("title", { ascending: true });
      } else if (sort === "za") {
        query = query.order("title", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch participant counts
      const retroIds = (data ?? []).map((r: any) => r.id);
      const countsMap: Record<string, number> = {};
      if (retroIds.length > 0) {
        const { data: pData } = await (supabase as any)
          .from("retro_participants")
          .select("retro_id")
          .in("retro_id", retroIds);
        if (pData) {
          for (const p of pData) {
            countsMap[p.retro_id] = (countsMap[p.retro_id] || 0) + 1;
          }
        }
      }

      return (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        format: r.format ?? "simple",
        created_at: r.created_at,
        project_name: r.projects?.name ?? null,
        team_name: r.teams?.name ?? null,
        participant_count: countsMap[r.id] || 0,
      }));
    },
    enabled: !!user,
    staleTime: 15 * 1000,
  });

  return { retros: retros ?? [], loading, error, refetch };
};
