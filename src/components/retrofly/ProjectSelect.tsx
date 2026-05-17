import { useState } from "react";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw } from "lucide-react";

interface ProjectSelectProps {
  value?: string;
  onChange: (projectId: string) => void;
  className?: string;
}

const ProjectSelect = ({ value, onChange, className }: ProjectSelectProps) => {
  const { projects, loading, error, refetch } = useProjects();
  const createProject = useCreateProject();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      toast({ title: "Project created", description: `"${project.name}" added.` });
      onChange(project.id);
      setDialogOpen(false);
      setName("");
      setDescription("");
    } catch {
      toast({
        title: "Failed to create project",
        description: "Please try again.",
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
        <span>Failed to load projects</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  // Determine display value for stale references
  const displayValue = value
    ? projects.find((p) => p.id === value)
      ? undefined // let Select handle it
      : "Unknown project"
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
          <SelectValue placeholder={displayValue ?? "Select a project"} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {projects.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No projects yet
            </div>
          )}
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          <div className="border-t border-border mt-1 pt-1">
            <SelectItem
              value="__add_new__"
              className="text-accent-foreground font-medium"
            >
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                Add new project
              </span>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name *</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q1 Sprint"
                className="rounded-xl h-11"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">Description</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description…"
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createProject.isPending}
              className="rounded-full"
            >
              {createProject.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectSelect;
