import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { HeartIcon, HeartIconOutline } from "@/components/icons/HeartIcon";
import { useToggleUpvote, type UpvoteInfo } from "@/hooks/useUpvotes";
import { useToast } from "@/hooks/use-toast";
import type { Response } from "@/hooks/useResponses";

const SENTIMENT_EMOJI: Record<number, string> = {
  1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄",
};

interface InsightCardProps {
  response: Response;
  upvoteInfo: UpvoteInfo;
  isClosed: boolean;
}

const InsightCard = ({ response, upvoteInfo, isClosed }: InsightCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const toggleUpvote = useToggleUpvote();
  const { toast } = useToast();

  const handleUpvote = () => {
    if (isClosed || toggleUpvote.isPending) return;
    toggleUpvote.mutate(
      {
        responseId: response.id,
        retroId: response.retro_id,
        hasUpvoted: upvoteInfo.hasUpvoted,
      },
      {
        onError: () => toast({ title: "Failed to toggle upvote", variant: "destructive" }),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-2"
    >
      <p
        onClick={() => setExpanded(!expanded)}
        className={`text-sm text-foreground cursor-pointer ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {response.text}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ProfileAvatar userId={response.user_id} size="sm" />
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleUpvote}
            disabled={isClosed || toggleUpvote.isPending}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              upvoteInfo.hasUpvoted
                ? "text-rose-500 bg-rose-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {upvoteInfo.hasUpvoted ? <HeartIcon size={12} /> : <HeartIconOutline size={12} />}
            {upvoteInfo.count > 0 && <span>{upvoteInfo.count}</span>}
          </motion.button>
          {response.sentiment && (
            <span className="text-sm">{SENTIMENT_EMOJI[response.sentiment]}</span>
          )}
          {response.is_action_item && (
            <Badge variant="outline" className="rounded-full text-[10px] gap-0.5 px-1.5 py-0">
              <AlertTriangle className="h-2.5 w-2.5" />
              Action
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
