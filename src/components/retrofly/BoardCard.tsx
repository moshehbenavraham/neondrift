import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateResponse, useDeleteResponse, type Response } from "@/hooks/useResponses";
import { useToggleUpvote } from "@/hooks/useUpvotes";
import type { UpvoteInfo } from "@/hooks/useUpvotes";
import { useCommentCount } from "@/hooks/useComments";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, MoreHorizontal, AlertTriangle, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { HeartIcon, HeartIconOutline } from "@/components/icons/HeartIcon";
import CommentsSection from "@/components/retrofly/CommentsSection";

const SENTIMENT_EMOJI: Record<number, string> = {
  1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

interface BoardCardProps {
  response: Response;
  isClosed: boolean;
  upvoteInfo: UpvoteInfo;
  accentColor?: string;
}

const BoardCard = ({ response, isClosed, upvoteInfo }: BoardCardProps) => {
  const { user } = useAuth();
  const updateResponse = useUpdateResponse();
  const deleteResponse = useDeleteResponse();
  const toggleUpvote = useToggleUpvote();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(response.text);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { data: commentCount = 0 } = useCommentCount(response.id);

  const isOwner = user?.id === response.user_id;
  const showMenu = isOwner && !isClosed;

  const handleUpvote = () => {
    if (isClosed || toggleUpvote.isPending) return;
    toggleUpvote.mutate(
      { responseId: response.id, retroId: response.retro_id, hasUpvoted: upvoteInfo.hasUpvoted },
      { onError: () => toast({ title: "Failed to toggle upvote", variant: "destructive" }) }
    );
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    try {
      await updateResponse.mutateAsync({ id: response.id, retro_id: response.retro_id, text: editText.trim() });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResponse.mutateAsync({ id: response.id, retro_id: response.retro_id });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-card text-card-foreground border border-border/60 rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-shadow duration-150 space-y-2 relative group"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ProfileAvatar userId={response.user_id} size="sm" showName />
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNowStrict(new Date(response.created_at), { addSuffix: true }).replace(/ minutes?/, 'min').replace(/ hours?/, 'h').replace(/ days?/, 'd').replace(/ seconds?/, 's')}
          </span>
        </div>
        {showMenu && !editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive-foreground">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Body */}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="rounded-md resize-none text-sm bg-background border-border"
            rows={2}
            autoFocus
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} disabled={updateResponse.isPending || !editText.trim()} className="rounded-md h-7 text-xs">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditText(response.text); }} className="rounded-md h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{response.text}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-1 pt-1.5">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUpvote}
            disabled={isClosed || toggleUpvote.isPending}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] transition-colors disabled:opacity-50 ${
              upvoteInfo.hasUpvoted
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {upvoteInfo.hasUpvoted ? <HeartIcon size={12} /> : <HeartIconOutline size={12} />}
            {upvoteInfo.count > 0 && <span>{upvoteInfo.count}</span>}
          </motion.button>
          <button
            onClick={() => setCommentsOpen(!commentsOpen)}
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${
              commentsOpen
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <MessageCircle className="h-3 w-3" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {response.sentiment && (
            <span className="text-sm" title={`Sentiment: ${response.sentiment}/5`}>
              {SENTIMENT_EMOJI[response.sentiment]}
            </span>
          )}
          {response.is_action_item && (
            <Badge variant="outline" className="rounded text-[9px] gap-0.5 px-1 py-0 h-4 border-border font-normal">
              <AlertTriangle className="h-2.5 w-2.5" />
              Action
            </Badge>
          )}
        </div>
      </div>

      {commentsOpen && (
        <CommentsSection responseId={response.id} isClosed={isClosed} />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete response?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteResponse.isPending} className="rounded-md">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default BoardCard;
