import { useState } from "react";
import { useTeams, useCreateTeam } from "@/hooks/useTeams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw } from "lucide-react";

interface TeamSelectProps {
  value?: string;
  onChange: (teamId: string) => void;
  className?: string;
}

const TeamSelect = ({ value, onChange, className }: TeamSelectProps) => {
  const { teams, loading, error, refetch } = useTeams();
  const createTeam = useCreateTeam();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const team = await createTeam.mutateAsync(name.trim());
      toast({ title: "Team created", description: `"${team.name}" added.` });
      onChange(team.id);
      setDialogOpen(false);
      setName("");
    } catch (err: any) {
      const isDuplicate = err?.message?.includes("unique") || err?.code === "23505";
      toast({
        title: isDuplicate ? "Team already exists" : "Failed to create team",
        description: isDuplicate
          ? `A team named "${name.trim()}" already exists.`
          : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-full rounded-xl" />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive-foreground">
        <span>Failed to load teams</span>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 px-2">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  const displayValue = value
    ? teams.find((t) => t.id === value)
      ? undefined
      : "Unknown team"
    : undefined;

  return (
    <>
      <Select value={value} onValueChange={(v) => {
        if (v === "__add_new__") {
          setDialogOpen(true);
        } else {
          onChange(v);
        }
      }}>
        <SelectTrigger className={`rounded-xl h-11 ${className ?? ""}`}>
          <SelectValue placeholder={displayValue ?? "Select a team"} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {teams.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No teams yet</div>
          )}
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <SelectItem value="__add_new__" className="text-accent-foreground font-medium">
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Add new team
              </span>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="team-name">Name *</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Frontend"
              className="rounded-xl h-11"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createTeam.isPending}
              className="rounded-full"
            >
              {createTeam.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamSelect;
