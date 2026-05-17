import { forwardRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { RetroQuestion } from "@/hooks/useRetros";
import type { Response } from "@/hooks/useResponses";
import type { UpvoteInfo } from "@/hooks/useUpvotes";
import type { ResponseGroup } from "@/hooks/useResponseGroups";
import DraggableBoardCard from "@/components/retrofly/DraggableBoardCard";
import GroupCard from "@/components/retrofly/GroupCard";
import AddResponseForm from "@/components/retrofly/AddResponseForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

// Notion-style column colors: dot color + faint bg
const COLUMN_STYLES = [
  { dot: "bg-blue-500", bg: "bg-blue-50", label: "text-blue-600" },
  { dot: "bg-amber-500", bg: "bg-amber-50", label: "text-amber-700" },
  { dot: "bg-emerald-500", bg: "bg-emerald-50", label: "text-emerald-700" },
  { dot: "bg-violet-500", bg: "bg-violet-50", label: "text-violet-700" },
  { dot: "bg-rose-500", bg: "bg-rose-50", label: "text-rose-700" },
  { dot: "bg-cyan-500", bg: "bg-cyan-50", label: "text-cyan-700" },
];

interface BoardColumnProps {
  question: RetroQuestion;
  responses: Response[];
  retroId: string;
  isClosed: boolean;
  colorIndex: number;
  getUpvoteInfo: (responseId: string) => UpvoteInfo;
  onResponseAdded?: () => void;
  groups: ResponseGroup[];
}

const BoardColumn = forwardRef<HTMLDivElement, BoardColumnProps>(({
  question,
  responses,
  retroId,
  isClosed,
  colorIndex,
  getUpvoteInfo,
  onResponseAdded,
  groups,
}, ref) => {
  const columnGroups = groups.filter((g) => g.question_id === question.id);
  const groupedResponseMap = new Map<string, Response[]>();
  const ungrouped: Response[] = [];

  for (const r of responses) {
    const gid = (r as any).group_id;
    if (gid && columnGroups.some((g) => g.id === gid)) {
      const arr = groupedResponseMap.get(gid) || [];
      arr.push(r);
      groupedResponseMap.set(gid, arr);
    } else {
      ungrouped.push(r);
    }
  }

  const { setNodeRef: setUngroupedRef, isOver: isOverUngrouped } = useDroppable({
    id: `ungrouped-${question.id}`,
    data: { type: "ungrouped", questionId: question.id },
  });

  const style = COLUMN_STYLES[colorIndex % COLUMN_STYLES.length];
  const totalCount = responses.length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: colorIndex * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col min-h-[420px] ${style.bg} rounded-xl p-3`}
    >
      {/* Notion-style column header: dot + name + count */}
      <div className="flex items-center gap-2 px-1 pb-2.5 mb-2">
        <span className={`h-2 w-2 rounded-full ${style.dot} flex-shrink-0`} />
        <h3 className={`text-sm font-medium ${style.label} leading-snug`}>
          {question.question_text}
        </h3>
        <span className="text-xs text-muted-foreground ml-auto tabular-nums flex-shrink-0">
          {totalCount}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 min-h-0 max-h-[calc(100vh-260px)]">
        <div className="space-y-1.5 pr-1">
          <AnimatePresence>
            {columnGroups.map((group) => {
              const groupResponses = groupedResponseMap.get(group.id) || [];
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  count={groupResponses.length}
                  accentColor=""
                  isClosed={isClosed}
                  columnGradient="transparent"
                >
                  {groupResponses.map((response) => (
                    <DraggableBoardCard
                      key={response.id}
                      response={response}
                      isClosed={isClosed}
                      upvoteInfo={getUpvoteInfo(response.id)}
                      questionId={question.id}
                    />
                  ))}
                </GroupCard>
              );
            })}
          </AnimatePresence>

          <div
            ref={setUngroupedRef}
            className={`space-y-1.5 min-h-[20px] rounded-md transition-colors ${
              isOverUngrouped ? "bg-muted/50" : ""
            }`}
          >
            {ungrouped.length === 0 && columnGroups.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No responses yet</p>
              </div>
            )}
            <AnimatePresence>
              {ungrouped.map((response) => (
                <DraggableBoardCard
                  key={response.id}
                  response={response}
                  isClosed={isClosed}
                  upvoteInfo={getUpvoteInfo(response.id)}
                  questionId={question.id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>

      {/* Notion-style "+ New" at bottom */}
      {!isClosed && (
        <div className="mt-auto pt-1.5">
          <AddResponseForm
            retroId={retroId}
            questionId={question.id}
            isClosed={isClosed}
            compact
            onSubmitSuccess={onResponseAdded}
          />
        </div>
      )}
    </motion.div>
  );
});

BoardColumn.displayName = "BoardColumn";

export default BoardColumn;
