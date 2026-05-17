import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useComments, useAddComment, useDeleteComment } from "@/hooks/useComments";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Trash2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CommentsSectionProps {
  responseId: string;
  isClosed: boolean;
}

const CommentsSection = ({ responseId, isClosed }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(responseId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { toast } = useToast();
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || addComment.isPending) return;
    addComment.mutate(
      { responseId, text: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: () => toast({ title: "Failed to add comment", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteComment.mutate(
      { id, responseId },
      { onError: () => toast({ title: "Failed to delete comment", variant: "destructive" }) }
    );
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : (
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 group/comment py-1"
            >
              <div className="flex-1 min-w-0">
                <ProfileAvatar userId={c.user_id} size="sm" showName />
                <p className="text-xs text-foreground whitespace-pre-wrap mt-0.5 ml-8">{c.text}</p>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              {user?.id === c.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/comment:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                  onClick={() => handleDelete(c.id)}
                  disabled={deleteComment.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {!isClosed && (
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 min-w-0 rounded-md border border-border bg-muted/50 text-foreground px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            disabled={!text.trim() || addComment.isPending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}
    </div>
  );
};

export default CommentsSection;
