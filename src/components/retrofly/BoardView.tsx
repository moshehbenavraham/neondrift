import { useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { useRetroQuestions } from "@/hooks/useRetros";
import { useResponses } from "@/hooks/useResponses";
import { useUpvotes } from "@/hooks/useUpvotes";
import { useResponseGroups, useMoveToGroup, useCreateGroup } from "@/hooks/useResponseGroups";
import { supabase } from "@/integrations/supabase/client";
import type { Retro } from "@/hooks/useRetros";
import BoardColumn from "@/components/retrofly/BoardColumn";
import ErrorState from "@/components/retrofly/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

interface BoardViewProps {
  retro: Retro;
}

const BoardView = ({ retro }: BoardViewProps) => {
  const { questions, loading: qLoading } = useRetroQuestions(retro.id);
  const { responses, loading: rLoading, error, refetch } = useResponses(retro.id);
  const { getUpvoteInfo } = useUpvotes(retro.id);
  const { groups } = useResponseGroups(retro.id);
  const moveToGroup = useMoveToGroup();
  const createGroup = useCreateGroup();
  const [creatingGroup, setCreatingGroup] = useState(false);

  const isClosed = retro.status === "closed";
  const loading = qLoading || rLoading;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest("button, input, textarea, [role='dialog'], [data-radix-popper-content-wrapper]")) return;
    setIsDragging(true);
    dragState.current = { startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      scrollRef.current.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || !active.data.current) return;

      const cardData = active.data.current;
      if (cardData.type !== "card") return;

      const responseId = cardData.responseId as string;
      const currentGroupId = cardData.groupId as string | null;
      const overData = over.data.current;

      if (!overData) return;

      if (overData.type === "card") {
        const targetResponseId = overData.responseId as string;
        const targetGroupId = overData.groupId as string | null;
        if (responseId === targetResponseId) return;
        if (currentGroupId && currentGroupId === targetGroupId) return;
        const questionId = overData.questionId as string;
        try {
          setCreatingGroup(true);
          const draggedResponse = responses.find((r) => r.id === responseId);
          const targetResponse = responses.find((r) => r.id === targetResponseId);
          const texts = [draggedResponse?.text, targetResponse?.text].filter(Boolean) as string[];

          let groupName = "New Group";
          if (texts.length >= 2) {
            try {
              const { data } = await supabase.functions.invoke("name-group", { body: { texts } });
              if (data?.name) groupName = data.name;
            } catch {
              // Keep the fallback name when automatic naming is unavailable.
            }
          }

          const group = await createGroup.mutateAsync({
            retro_id: retro.id,
            question_id: questionId,
            name: groupName,
          });
          moveToGroup.mutate({ responseId, groupId: group.id, retroId: retro.id });
          moveToGroup.mutate({ responseId: targetResponseId, groupId: group.id, retroId: retro.id });
        } catch {
          // toast handled by mutation
        } finally {
          setCreatingGroup(false);
        }
      } else if (overData.type === "group") {
        const targetGroupId = overData.groupId as string;
        if (targetGroupId !== currentGroupId) {
          moveToGroup.mutate({ responseId, groupId: targetGroupId, retroId: retro.id });
        }
      } else if (overData.type === "ungrouped") {
        if (currentGroupId) {
          moveToGroup.mutate({ responseId, groupId: null, retroId: retro.id });
        }
      }
    },
    [moveToGroup, createGroup, retro.id, responses]
  );

  if (error) {
    return <ErrorState message="Failed to load board" onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 min-w-[280px] h-[400px] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {creatingGroup && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-lg shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            <span className="text-sm font-medium text-foreground">Creating group...</span>
          </div>
        </div>
      )}
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20 min-h-[480px]"
      >
        {questions.map((question, idx) => {
          const questionResponses = responses
            .filter((r) => r.question_id === question.id)
            .sort((a, b) => {
              const diff = getUpvoteInfo(b.id).count - getUpvoteInfo(a.id).count;
              return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

          return (
            <BoardColumn
              key={question.id}
              question={question}
              responses={questionResponses}
              retroId={retro.id}
              isClosed={isClosed}
              colorIndex={idx}
              getUpvoteInfo={getUpvoteInfo}
              groups={groups}
            />
          );
        })}
      </div>
    </DndContext>
    </div>
  );
};

export default BoardView;
