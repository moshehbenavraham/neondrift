import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDashboardRetros } from "@/hooks/useDashboardRetros";
import { useProjects } from "@/hooks/useProjects";
import { useTeams } from "@/hooks/useTeams";
import RetroCard from "@/components/retrofly/RetroCard";
import EmptyState from "@/components/retrofly/EmptyState";
import ErrorState from "@/components/retrofly/ErrorState";
import { SkeletonRetroCard } from "@/components/retrofly/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, X, ArrowUpDown } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import SEO from "@/components/SEO";

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  const projectId = searchParams.get("project") ?? "";
  const teamId = searchParams.get("team") ?? "";
  const status = (searchParams.get("status") as "open" | "closed" | "all") ?? "open";
  const sort = (searchParams.get("sort") as "newest" | "oldest" | "az" | "za") ?? "newest";

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    setSearchParams(params, { replace: true });
  }, 300);

  useEffect(() => {
    debouncedSetSearch(searchInput);
  }, [searchInput]);

  const { retros, loading, error, refetch } = useDashboardRetros({
    search: debouncedSearch,
    projectId,
    teamId,
    status,
    sort,
  });

  const { projects } = useProjects();
  const { teams } = useTeams();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && value !== "") params.set(key, value);
    else params.delete(key);
    setSearchParams(params, { replace: true });
  };

  const hasFilters = debouncedSearch || projectId || teamId || status !== "open" || sort !== "newest";

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-6 relative z-10">
      <SEO title="Dashboard" path="/dashboard" noindex />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground tracking-[-0.06em]">Retrospectives</h1>
        <Button asChild size="sm" className="rounded-md font-medium">
          <Link to="/retros/new">
            <Plus className="h-4 w-4" />
            New
          </Link>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="border border-border rounded-md bg-card py-2.5 px-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search retros..."
            className="pl-8 h-8 rounded-md bg-background border-border text-sm"
          />
        </div>

        <Select value={projectId || "all"} onValueChange={(v) => setFilter("project", v === "all" ? "" : v)}>
          <SelectTrigger className="rounded-md sm:w-36 h-8 bg-background border-border text-sm">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={teamId || "all"} onValueChange={(v) => setFilter("team", v === "all" ? "" : v)}>
          <SelectTrigger className="rounded-md sm:w-36 h-8 bg-background border-border text-sm">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger className="rounded-md sm:w-28 h-8 bg-background border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setFilter("sort", v)}>
          <SelectTrigger className="rounded-md sm:w-32 h-8 bg-background border-border text-sm">
            <ArrowUpDown className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="az">A – Z</SelectItem>
            <SelectItem value="za">Z – A</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 rounded-md h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {error && <ErrorState message="Failed to load retros" onRetry={() => refetch()} />}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonRetroCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && retros.length === 0 && hasFilters && (
        <div className="text-center py-16 space-y-4">
          <EmptyState emoji="🔍" title="No retros match your filters" description="Try adjusting your search or filters." />
          <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-md gap-1 border-border">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </div>
      )}

      {!loading && !error && retros.length === 0 && !hasFilters && (
        <EmptyState emoji="🚀" title="No open retros" description="Create your first retro to get started!" actionLabel="New retro" actionHref="/retros/new" useMascot />
      )}

      {!loading && !error && retros.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {retros.map((retro, idx) => (
            <RetroCard key={retro.id} retro={retro} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
