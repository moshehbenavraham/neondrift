import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateResponse, useDeleteResponse, useToggleActionFlag, type Response } from "@/hooks/useResponses";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, AlertTriangle, MessageCircle, Flag, FlagOff } from "lucide-react";
import { motion } from "framer-motion";
import { HeartIcon, HeartIconOutline } from "@/components/icons/HeartIcon";
import type { UpvoteInfo } from "@/hooks/useUpvotes";
import { useToggleUpvote } from "@/hooks/useUpvotes";
import { useCommentCount } from "@/hooks/useComments";
import CommentsSection from "@/components/retrofly/CommentsSection";

const SENTIMENT_EMOJI: Record<number, string> = {
  1: "😢",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

interface ResponseCardProps {
  response: Response;
  isClosed: boolean;
  upvoteInfo: UpvoteInfo;
}

const ResponseCard = ({ response, isClosed, upvoteInfo }: ResponseCardProps) => {
  const { user } = useAuth();
  const updateResponse = useUpdateResponse();
  const deleteResponse = useDeleteResponse();
  const toggleUpvote = useToggleUpvote();
  const toggleActionFlag = useToggleActionFlag();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(response.text);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { data: commentCount = 0 } = useCommentCount(response.id);

  const handleUpvote = () => {
    if (isClosed || toggleUpvote.isPending) return;
    toggleUpvote.mutate(
      {
        responseId: response.id,
        retroId: response.retro_id,
        hasUpvoted: upvoteInfo.hasUpvoted,
      },
      {
        onError: () => {
          toast({ title: "Failed to toggle upvote", variant: "destructive" });
        },
      }
    );
  };

  const isOwner = user?.id === response.user_id;
  const showMenu = isOwner && !isClosed;

  const handleSave = async () => {
    if (!editText.trim()) return;
    try {
      await updateResponse.mutateAsync({
        id: response.id,
        retro_id: response.retro_id,
        text: editText.trim(),
      });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResponse.mutateAsync({
        id: response.id,
        retro_id: response.retro_id,
      });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white/[0.12] backdrop-blur-2xl border border-white/[0.2] rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="rounded-xl resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateResponse.isPending || !editText.trim()}
                  className="rounded-full"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setEditText(response.text);
                  }}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{response.text}</p>
          )}
        </div>

        {showMenu && !editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toggleActionFlag.mutate({
                    id: response.id,
                    retro_id: response.retro_id,
                    text: response.text,
                    is_action_item: !response.is_action_item,
                  })
                }
                disabled={toggleActionFlag.isPending}
              >
                {response.is_action_item ? (
                  <>
                    <FlagOff className="h-3 w-3 mr-2" />
                    Remove action flag
                  </>
                ) : (
                  <>
                    <Flag className="h-3 w-3 mr-2" />
                    Flag as action
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-destructive-foreground"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ProfileAvatar userId={response.user_id} size="sm" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleUpvote}
            disabled={isClosed || toggleUpvote.isPending}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
              upvoteInfo.hasUpvoted
                ? "text-rose-500 bg-rose-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {upvoteInfo.hasUpvoted ? (
              <HeartIcon size={14} />
            ) : (
              <HeartIconOutline size={14} />
            )}
            {upvoteInfo.count > 0 && <span>{upvoteInfo.count}</span>}
          </motion.button>
          <button
            onClick={() => setCommentsOpen(!commentsOpen)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
              commentsOpen
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>
          {response.sentiment && (
            <span className="text-base" title={`Sentiment: ${response.sentiment}/5`}>
              {SENTIMENT_EMOJI[response.sentiment]}
            </span>
          )}
          {response.is_action_item && (
            <Badge variant="outline" className="rounded-full text-xs gap-1 px-2 py-0.5">
              <AlertTriangle className="h-3 w-3" />
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
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteResponse.isPending}
              className="rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ResponseCard;
