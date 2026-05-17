import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { motion, useMotionValue, animate, AnimatePresence } from "framer-motion";
import { useTimelineEntries, useDeleteTimelineEntry, useUpdateTimelineEntry, type TimelineEntry } from "@/hooks/useTimelineEntries";
import { useUpdateRetroDates, type Retro } from "@/hooks/useRetros";
import AddTimelineEntryForm from "@/components/retrofly/AddTimelineEntryForm";
import ErrorState from "@/components/retrofly/ErrorState";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Check, Edit2, Trash2, X } from "lucide-react";

interface TimelineTabProps {
  retro: Retro;
}

const ENTRY_SPACING = 200;
const DOT_SIZE = 14;
const SCROLL_STEP = 300;
const TRUNCATE_LEN = 80;
const MIN_GAP_PX = 240;
const TRACK_PADDING = 120;

/** Nudge overlapping entries apart, returns adjusted leftPercent per entry id */
const resolveOverlaps = (
  items: { id: string; leftPercent: number; sortIndex: number }[],
  trackWidth: number
): { positions: Map<string, number>; neededWidth: number } => {
  if (items.length === 0) return { positions: new Map(), neededWidth: trackWidth };

  const sorted = [...items].sort((a, b) => a.sortIndex - b.sortIndex);
  // Map percent to px, offset by TRACK_PADDING so nothing starts at 0
  const usableWidth = trackWidth - 2 * TRACK_PADDING;
  const pxPositions: { id: string; px: number }[] = sorted.map((it) => ({
    id: it.id,
    px: TRACK_PADDING + (it.leftPercent / 100) * usableWidth,
  }));

  // Walk left-to-right, push right if too close
  for (let i = 1; i < pxPositions.length; i++) {
    const gap = pxPositions[i].px - pxPositions[i - 1].px;
    if (gap < MIN_GAP_PX) {
      pxPositions[i].px = pxPositions[i - 1].px + MIN_GAP_PX;
    }
  }

  const maxPx = pxPositions[pxPositions.length - 1].px + TRACK_PADDING;
  const neededWidth = Math.max(trackWidth, maxPx);

  const positions = new Map<string, number>();
  for (const p of pxPositions) {
    positions.set(p.id, (p.px / neededWidth) * 100);
  }
  return { positions, neededWidth };
};

const computeDayOffset = (entry: TimelineEntry, startDate: Date): number => {
  const entryDate = parseISO(entry.entry_date);
  let dayOffset = differenceInDays(entryDate, startDate);
  if (entry.entry_time) {
    const [h, m] = entry.entry_time.split(":").map(Number);
    dayOffset += (h * 60 + (m || 0)) / 1440;
  }
  return dayOffset;
};

const formatTime12 = (time: string) =>
  time.slice(0, 5).replace(/^(\d{2}):(\d{2})$/, (_m, h, min) => {
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${min} ${hr >= 12 ? "PM" : "AM"}`;
  });

/* ─── Retro Date Range Header ─── */
const RetroDateRange = ({ retro }: { retro: Retro }) => {
  const { user } = useAuth();
  const isCreator = user?.id === retro.created_by;
  const isOpen = retro.status === "open";
  const [editing, setEditing] = useState(false);
  const [startVal, setStartVal] = useState(retro.timeline_start?.slice(0, 16) ?? "");
  const [endVal, setEndVal] = useState(retro.timeline_end?.slice(0, 16) ?? "");
  const updateDates = useUpdateRetroDates();

  const handleSave = async () => {
    if (!startVal || !endVal) return;
    try {
      await updateDates.mutateAsync({
        retroId: retro.id,
        timeline_start: startVal,
        timeline_end: endVal,
      });
      setEditing(false);
    } catch {
      // toast handled in hook
    }
  };

  const startFormatted = retro.timeline_start
    ? format(parseISO(retro.timeline_start), "MMM d, yyyy")
    : "No start";
  const endFormatted = retro.timeline_end
    ? format(parseISO(retro.timeline_end), "MMM d, yyyy")
    : "No end";

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="datetime-local"
          value={startVal}
          onChange={(e) => setStartVal(e.target.value)}
          className="w-auto rounded-xl bg-white/[0.12] backdrop-blur-xl border-white/[0.2] text-foreground text-sm"
        />
        <span className="text-muted-foreground text-sm">–</span>
        <Input
          type="datetime-local"
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          min={startVal}
          className="w-auto rounded-xl bg-white/[0.12] backdrop-blur-xl border-white/[0.2] text-foreground text-sm"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-primary hover:text-primary"
          onClick={handleSave}
          disabled={updateDates.isPending}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => {
            setStartVal(retro.timeline_start?.slice(0, 16) ?? "");
            setEndVal(retro.timeline_end?.slice(0, 16) ?? "");
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground font-medium">
        {startFormatted} – {endFormatted}
      </span>
      {isCreator && isOpen && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setEditing(true)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

/* ─── Single dot + card on the timeline ─── */
const TimelineDot = ({
  entry,
  leftPercent,
  above,
  isClosed,
}: {
  entry: TimelineEntry;
  leftPercent: number;
  above: boolean;
  isClosed: boolean;
}) => {
  const { user } = useAuth();
  const deleteEntry = useDeleteTimelineEntry();
  const updateEntry = useUpdateTimelineEntry();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(entry.description);
  const [expanded, setExpanded] = useState(false);
  const isOwner = user?.id === entry.user_id;
  const isLong = entry.description.length > TRUNCATE_LEN;

  const handleDelete = async () => {
    try {
      await deleteEntry.mutateAsync({ id: entry.id, retro_id: entry.retro_id });
      setDeleteOpen(false);
    } catch {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        retro_id: entry.retro_id,
        description: trimmed,
      });
      setEditOpen(false);
    } catch {
      toast({ title: "Failed to update entry", variant: "destructive" });
    }
  };

  const displayText = expanded || !isLong
    ? entry.description
    : entry.description.slice(0, TRUNCATE_LEN - 3) + "…";

  const cardContent = (
    <div className={`${above ? "mb-1" : "mt-1"} max-w-[220px] rounded-xl border border-border bg-card/80 backdrop-blur-sm px-3 py-2 shadow-sm`}>
      <p className="text-xs text-foreground leading-snug">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-[10px] text-primary hover:underline flex items-center gap-0.5"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show more <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
      <div className="mt-1.5 flex items-center justify-between">
        <ProfileAvatar userId={entry.user_id} size="sm" showName={false} />
        {isOwner && !isClosed && (
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditText(entry.description);
              setEditOpen(true);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="absolute flex flex-col items-center"
        style={{ left: `${leftPercent}%`, transform: "translateX(-50%)", ...(above ? { bottom: 0 } : { top: 0 }) }}
      >
        {above && (
          <>
            {cardContent}
            <span className="mb-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
              {format(parseISO(entry.entry_date), "MMM d")}
              {entry.entry_time && ` ${formatTime12(entry.entry_time)}`}
            </span>
            <div className="w-px h-4 bg-primary/40" />
          </>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <motion.button
              className="relative z-10 rounded-full bg-primary border-2 border-primary-foreground/20 shadow-[0_0_8px_hsl(var(--primary)/0.4)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ width: DOT_SIZE, height: DOT_SIZE }}
              whileHover={{ scale: 1.4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
          </PopoverTrigger>
          <PopoverContent
            side={above ? "top" : "bottom"}
            className="w-64 rounded-xl p-3 space-y-2"
          >
            <p className="text-sm text-foreground leading-relaxed">
              {entry.description}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(entry.entry_date), "MMM d, yyyy")}
              {entry.entry_time && ` at ${formatTime12(entry.entry_time)}`}
            </p>
            <div className="flex items-center justify-between">
              <ProfileAvatar userId={entry.user_id} size="sm" />
              {isOwner && !isClosed && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditText(entry.description);
                      setEditOpen(true);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {!above && (
          <>
            <div className="w-px h-4 bg-primary/40" />
            <span className="mt-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
              {format(parseISO(entry.entry_date), "MMM d")}
              {entry.entry_time && ` ${formatTime12(entry.entry_time)}`}
            </span>
            {cardContent}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit timeline entry</AlertDialogTitle>
            <AlertDialogDescription>
              {format(parseISO(entry.entry_date), "MMM d, yyyy")}
              {entry.entry_time && ` at ${formatTime12(entry.entry_time)}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full text-sm bg-transparent border border-border rounded-xl px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
            rows={4}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => setEditText(entry.description)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveEdit}
              disabled={updateEntry.isPending || !editText.trim()}
              className="rounded-full"
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete timeline entry?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteEntry.isPending}
              className="rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

/* ─── Day Lanes: alternating bands + dividers + labels ─── */
const DayLanes = ({
  startDate,
  totalDays,
}: {
  startDate: Date;
  totalDays: number;
}) => {
  const lanes = useMemo(() => {
    const dayCount = totalDays + 1;
    const result: { label: string; shortLabel: string; leftPercent: number; widthPercent: number; index: number }[] = [];
    for (let d = 0; d < dayCount; d++) {
      const date = addDays(startDate, d);
      result.push({
        label: format(date, "EEE, MMM d"),
        shortLabel: format(date, "MMM d"),
        leftPercent: (d / dayCount) * 100,
        widthPercent: (1 / dayCount) * 100,
        index: d,
      });
    }
    return result;
  }, [startDate, totalDays]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {lanes.map((lane) => (
        <div
          key={lane.index}
          className="absolute top-0 bottom-0"
          style={{
            left: `${lane.leftPercent}%`,
            width: `${lane.widthPercent}%`,
          }}
        >
          <div
            className={`absolute inset-0 ${
              lane.index % 2 === 0
                ? "bg-muted-foreground/[0.03]"
                : "bg-muted-foreground/[0.07]"
            } rounded-sm`}
          />
          {lane.index > 0 && (
            <div className="absolute left-0 top-0 bottom-0 w-px border-l border-dashed border-muted-foreground/20" />
          )}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10">
            <span className="inline-block whitespace-nowrap text-[10px] font-medium text-muted-foreground bg-muted/60 backdrop-blur-sm rounded-full px-2 py-0.5">
              {totalDays <= 14 ? lane.label : lane.shortLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Main TimelineTab ─── */
const TimelineTab = ({ retro }: TimelineTabProps) => {
  const { entries, loading, error, refetch } = useTimelineEntries(retro.id);
  const isClosed = retro.status === "closed";
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const startDate = retro.timeline_start ? parseISO(retro.timeline_start) : new Date();
  const endDate = retro.timeline_end ? parseISO(retro.timeline_end) : new Date();
  const totalDays = Math.max(differenceInDays(endDate, startDate), 1);

  const [containerWidth, setContainerWidth] = useState(0);

  // Compute raw positions and resolve overlaps
  const rawItems = useMemo(
    () =>
      entries.map((entry, i) => {
        const dayOffset = computeDayOffset(entry, startDate);
        const leftPercent = totalDays === 0 ? 50 : (dayOffset / (totalDays + 1)) * 100;
        return { id: entry.id, leftPercent, sortIndex: i };
      }),
    [entries, startDate, totalDays]
  );

  const baseTrackWidth = Math.max(
    containerWidth || 600,
    entries.length * ENTRY_SPACING + 2 * TRACK_PADDING,
    totalDays * 40 + 2 * TRACK_PADDING
  );

  const { positions: adjustedPositions, neededWidth } = useMemo(
    () => resolveOverlaps(rawItems, baseTrackWidth),
    [rawItems, baseTrackWidth]
  );

  const trackWidth = Math.max(neededWidth, containerWidth || 600);

  // Sort entries by adjusted position for correct above/below alternation
  const sortedEntries = useMemo(() => {
    return entries.map((entry, i) => ({
      entry,
      above: i % 2 === 0,
      leftPercent: adjustedPositions.get(entry.id) ?? 50,
    }));
  }, [entries, adjustedPositions]);

  const scrollBy = useCallback(
    (dir: number) => {
      const container = containerRef.current;
      if (!container) return;
      const maxScroll = -(trackWidth - container.clientWidth);
      const current = x.get();
      const next = Math.min(0, Math.max(maxScroll, current + dir * SCROLL_STEP));
      animate(x, next, { type: "spring", stiffness: 300, damping: 30 });
    },
    [trackWidth, x]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (error) {
    return <ErrorState message="Failed to load timeline" onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-20 w-32 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RetroDateRange retro={retro} />

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center min-h-[160px]">
          <p className="text-sm text-muted-foreground">
            No timeline entries yet — add the first one! 📅
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card relative group">
          <button
            onClick={() => scrollBy(1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>

          <button
            onClick={() => scrollBy(-1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>

          <div ref={containerRef} className="overflow-hidden px-6 py-6">
            <motion.div
              drag="x"
              dragConstraints={{
                right: 0,
                left: containerRef.current
                  ? -(trackWidth - containerRef.current.clientWidth)
                  : 0,
              }}
              dragElastic={0.1}
              style={{ x, width: trackWidth, minWidth: '100%' }}
              className="relative"
            >
              {/* Day lanes behind everything */}
              <DayLanes startDate={startDate} totalDays={totalDays} />

              <div className="relative min-h-[12rem] pt-6">
                {sortedEntries
                  .filter((item) => item.above)
                  .map((item) => (
                    <TimelineDot
                      key={item.entry.id}
                      entry={item.entry}
                      leftPercent={item.leftPercent}
                      above={true}
                      isClosed={isClosed}
                    />
                  ))}
              </div>

              <div className="relative h-px">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>

              <div className="relative min-h-[12rem] mt-1">
                {sortedEntries
                  .filter((item) => !item.above)
                  .map((item) => (
                    <TimelineDot
                      key={item.entry.id}
                      entry={item.entry}
                      leftPercent={item.leftPercent}
                      above={false}
                      isClosed={isClosed}
                    />
                  ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <AddTimelineEntryForm
        retroId={retro.id}
        startDate={retro.timeline_start}
        endDate={retro.timeline_end}
        isClosed={isClosed}
      />
    </div>
  );
};

export default TimelineTab;
