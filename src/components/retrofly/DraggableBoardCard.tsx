import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import BoardCard from "@/components/retrofly/BoardCard";
import type { Response } from "@/hooks/useResponses";
import type { UpvoteInfo } from "@/hooks/useUpvotes";

interface DraggableBoardCardProps {
  response: Response;
  isClosed: boolean;
  upvoteInfo: UpvoteInfo;
  accentColor?: string;
  questionId: string;
}

const DraggableBoardCard = ({ response, isClosed, upvoteInfo, questionId }: DraggableBoardCardProps) => {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `card-${response.id}`,
    data: { type: "card", responseId: response.id, groupId: (response as any).group_id, questionId },
    disabled: isClosed,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-card-${response.id}`,
    data: { type: "card", responseId: response.id, questionId, groupId: (response as any).group_id },
    disabled: isClosed || isDragging,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.6 : 1,
      }
    : undefined;

  return (
    <div
      ref={(node) => { setDragRef(node); setDropRef(node); }}
      style={style}
      {...(isClosed ? {} : { ...listeners, ...attributes })}
      className={`relative ${!isClosed ? "cursor-grab active:cursor-grabbing" : ""} ${isOver && !isDragging ? "ring-1 ring-foreground/20 rounded-md" : ""}`}
    >
      <BoardCard response={response} isClosed={isClosed} upvoteInfo={upvoteInfo} />
    </div>
  );
};

export default DraggableBoardCard;
