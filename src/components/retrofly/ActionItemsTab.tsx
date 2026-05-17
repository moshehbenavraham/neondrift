import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import {
  useActionItems,
  useUpdateActionItem,
  useDeleteActionItem,
} from "@/hooks/useActionItems";
import type { Retro } from "@/hooks/useRetros";
import AddActionItemForm from "@/components/retrofly/AddActionItemForm";
import EmptyState from "@/components/retrofly/EmptyState";
import { SkeletonActionItem } from "@/components/retrofly/skeletons";
import ErrorState from "@/components/retrofly/ErrorState";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ActionItemsTabProps {
  retro: Retro;
}

const ActionItemsTab = ({ retro }: ActionItemsTabProps) => {
  const { items, loading, error, refetch } = useActionItems(retro.id);
  const updateItem = useUpdateActionItem();
  const deleteItem = useDeleteActionItem();
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isClosed = retro.status === "closed";

  // Sort: open first, then done
  const sorted = [...items].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === "open" ? -1 : 1;
  });

  const doneCount = items.filter((i) => i.status === "done").length;

  const handleToggle = async (id: string, currentStatus: "open" | "done") => {
    const newStatus = currentStatus === "open" ? "done" : "open";
    try {
      await updateItem.mutateAsync({ id, retro_id: retro.id, status: newStatus });
      toast({ title: newStatus === "done" ? "Marked done ✅" : "Reopened" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleUpdateDueDate = async (id: string, date: string) => {
    try {
      await updateItem.mutateAsync({ id, retro_id: retro.id, due_date: date || null });
      toast({ title: "Due date updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteItem.mutateAsync({ id: deleteId, retro_id: retro.id });
      setDeleteId(null);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  if (error) {
    return <ErrorState message="Failed to load action items" onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <SkeletonActionItem key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AddActionItemForm retroId={retro.id} isClosed={isClosed} />

      {items.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {doneCount} of {items.length} done
        </p>
      )}

      {items.length === 0 && (
        <EmptyState
          emoji="✅"
          title="No action items yet"
          description="Flag responses or add one manually to track follow-ups."
          useMascot
        />
      )}

      <AnimatePresence>
        {sorted.map((item) => {
          const isOwner = user?.id === item.created_by;
          const isManual = !item.response_id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-start gap-3 ${
                item.status === "done" ? "opacity-60" : ""
              }`}
            >
              <div className="pt-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center">
                {updateItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Checkbox
                    checked={item.status === "done"}
                    disabled={isClosed}
                    onCheckedChange={() => handleToggle(item.id, item.status)}
                    className="h-5 w-5"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p
                  className={`text-sm text-foreground ${
                    item.status === "done" ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.description}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {item.owner_id ? (
                    <div className="flex items-center gap-1">
                      <ProfileAvatar userId={item.owner_id} size="sm" />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}

                  {!isClosed ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                          <Calendar className="h-3 w-3" />
                          {item.due_date
                            ? format(new Date(item.due_date), "MMM d, yyyy")
                            : "No due date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 rounded-xl">
                        <Input
                          type="date"
                          defaultValue={item.due_date ?? ""}
                          onChange={(e) => handleUpdateDueDate(item.id, e.target.value)}
                          className="rounded-lg"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <span className="text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {item.due_date
                        ? format(new Date(item.due_date), "MMM d, yyyy")
                        : "No due date"}
                    </span>
                  )}

                  <Badge variant="outline" className="rounded-full text-[10px] px-1.5 py-0">
                    {isManual ? "Manual" : "🔗 From response"}
                  </Badge>
                </div>
              </div>

              {isOwner && isManual && !isClosed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0 text-white/50 hover:text-red-400"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete action item?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteItem.isPending}
              className="rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActionItemsTab;
