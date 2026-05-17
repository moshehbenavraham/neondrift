import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRetro, useRetroQuestions } from "@/hooks/useRetros";
import { useAutoGroup } from "@/hooks/useResponseGroups";
import RetroHeader from "@/components/retrofly/RetroHeader";
import BoardView from "@/components/retrofly/BoardView";
import TimelineTab from "@/components/retrofly/TimelineTab";
import ActionItemsTab from "@/components/retrofly/ActionItemsTab";
import ViewTransition from "@/components/retrofly/ViewTransition";
import Top3Form from "@/components/retrofly/Top3Form";
import Top3Display from "@/components/retrofly/Top3Display";
import RetroSummarySheet from "@/components/retrofly/RetroSummarySheet";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SEO from "@/components/SEO";

const RetroViewPage = () => {
  const { id } = useParams();
  const { retro, loading, error } = useRetro(id);
  const { questions } = useRetroQuestions(id);
  const queryClient = useQueryClient();
  const autoGroup = useAutoGroup();

  const [actionsPanelOpen, setActionsPanelOpen] = useState(false);
  const [top3PanelOpen, setTop3PanelOpen] = useState(false);
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const invalidateResponses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["responses", id] });
  }, [queryClient, id]);
  const invalidateUpvotes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["upvotes", id] });
  }, [queryClient, id]);
  const invalidateTimeline = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["timeline_entries", id] });
  }, [queryClient, id]);
  const invalidateActionItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["action_items", id] });
  }, [queryClient, id]);
  const invalidateTop3 = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["top3", id] });
  }, [queryClient, id]);

  useRealtimeSubscription({ table: "responses", filterColumn: "retro_id", filterValue: id, onChange: invalidateResponses });
  useRealtimeSubscription({ table: "response_upvotes", onChange: invalidateUpvotes, enabled: !!id });
  useRealtimeSubscription({ table: "timeline_entries", filterColumn: "retro_id", filterValue: id, onChange: invalidateTimeline });
  useRealtimeSubscription({ table: "action_items", filterColumn: "retro_id", filterValue: id, onChange: invalidateActionItems });
  useRealtimeSubscription({ table: "top3_entries", filterColumn: "retro_id", filterValue: id, onChange: invalidateTop3 });

  const invalidateGroups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["response_groups", id] });
  }, [queryClient, id]);
  useRealtimeSubscription({ table: "response_groups", filterColumn: "retro_id", filterValue: id, onChange: invalidateGroups });

  const handleToggleTimeline = useCallback(() => {
    setShowTimeline((prev) => !prev);
  }, []);

  const handleAutoGroup = useCallback(async () => {
    if (!retro || !questions.length) return;
    for (const q of questions) {
      await autoGroup.mutateAsync({ retroId: retro.id, questionId: q.id });
    }
  }, [retro, questions, autoGroup]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SEO title="Loading retro" noindex />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !retro) {
    return (
      <div className="text-center py-20 space-y-2">
        <SEO title="Retro not found" noindex />
        <h2 className="text-xl font-semibold text-foreground">Retro not found</h2>
        <p className="text-muted-foreground text-sm">
          This retro may have been deleted or you may not have access.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pt-14 pb-20 px-6 md:px-12 lg:px-16 min-h-screen bg-background">
      <SEO title={retro.title || "Retro"} noindex />
      <div className="relative z-10">
      <RetroHeader
        retro={retro}
        onOpenActions={() => setActionsPanelOpen(true)}
        onOpenTimeline={handleToggleTimeline}
        onOpenTop3={() => setTop3PanelOpen(true)}
        onOpenSummary={() => setSummaryPanelOpen(true)}
        onAutoGroup={handleAutoGroup}
        isTimelineActive={showTimeline}
        isGrouping={autoGroup.isPending}
      />

      {/* Content area — board or timeline */}
      <div className="relative">
        <ViewTransition
          showAlternate={showTimeline}
          primary={<BoardView retro={retro} />}
          alternate={
            <div>
              <div className="mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={handleToggleTimeline}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Board
                </Button>
              </div>
              <TimelineTab retro={retro} />
            </div>
          }
        />
      </div>

      {/* Action Items Sheet */}
      <Sheet open={actionsPanelOpen} onOpenChange={setActionsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Action Items ✅</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ActionItemsTab retro={retro} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Top 3 Sheet */}
      <Sheet open={top3PanelOpen} onOpenChange={setTop3PanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Top 3 ✨</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6">
            <Top3Form retroId={retro.id} isClosed={retro.status === "closed"} />
            <Top3Display retroId={retro.id} />
          </div>
        </SheetContent>
      </Sheet>

      {/* AI Summary Sheet */}
      <RetroSummarySheet
        retroId={retro.id}
        open={summaryPanelOpen}
        onOpenChange={setSummaryPanelOpen}
      />
      </div>
    </div>
  );
};

export default RetroViewPage;
