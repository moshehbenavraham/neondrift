import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRenameGroup, useDeleteGroup } from "@/hooks/useResponseGroups";
import { motion, AnimatePresence } from "framer-motion";
import type { ResponseGroup } from "@/hooks/useResponseGroups";

interface GroupCardProps {
  group: ResponseGroup;
  count: number;
  accentColor: string;
  children: React.ReactNode;
  isClosed: boolean;
  columnGradient?: string;
}

const GroupCard = ({ group, count, children, isClosed }: GroupCardProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const renameGroup = useRenameGroup();
  const deleteGroup = useDeleteGroup();

  const { setNodeRef, isOver } = useDroppable({
    id: `group-${group.id}`,
    data: { type: "group", groupId: group.id },
  });

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === group.name) {
      setEditing(false);
      setEditName(group.name);
      return;
    }
    renameGroup.mutate({ id: group.id, retro_id: group.retro_id, name: trimmed });
    setEditing(false);
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-md border transition-colors duration-150 ${
        isOver ? "border-foreground/30" : "border-border"
      }`}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-2 px-3 py-2 group/trigger">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <ChevronRight
                className={`h-3 w-3 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                  open ? "rotate-90" : ""
                }`}
              />
              {editing ? (
                <Input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") { setEditing(false); setEditName(group.name); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-xs px-1.5 py-0"
                />
              ) : (
                <span className="text-xs font-medium text-foreground truncate">
                  {group.name}
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
            {count}
          </span>

          {!isClosed && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {editing ? (
                <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground" onClick={handleRename}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground" onClick={() => { setEditing(false); setEditName(group.name); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md text-muted-foreground hover:text-foreground opacity-0 group-hover/trigger:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-md text-muted-foreground hover:text-destructive-foreground opacity-0 group-hover/trigger:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGroup.mutate({ id: group.id, retro_id: group.retro_id });
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="px-2 pb-2 space-y-2">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Collapsible>
    </motion.div>
  );
};

export default GroupCard;
