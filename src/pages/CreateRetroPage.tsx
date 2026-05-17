import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateRetro } from "@/hooks/useRetros";
import ProjectSelect from "@/components/retrofly/ProjectSelect";
import TeamSelect from "@/components/retrofly/TeamSelect";
import QuestionsEditor, {
  DEFAULT_QUESTIONS,
} from "@/components/retrofly/QuestionsEditor";
import { Loader2, Calendar, Plane, ClipboardList } from "lucide-react";
import {
  createRetroSchema,
  createSimpleRetroSchema,
  type CreateRetroFormValues,
  type CreateSimpleRetroFormValues,
} from "@/lib/validations";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

type RetroFormat = "simple" | "detailed";

const FormatPicker = ({
  value,
  onChange,
}: {
  value: RetroFormat;
  onChange: (v: RetroFormat) => void;
}) => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    <button
      type="button"
      onClick={() => onChange("simple")}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
        value === "simple"
          ? "border-foreground bg-secondary"
          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary"
      )}
    >
      <Plane className="h-5 w-5 text-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">Simple Retro</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Start / Stop / Continue — quick and focused
        </p>
      </div>
    </button>
    <button
      type="button"
      onClick={() => onChange("detailed")}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all",
        value === "detailed"
          ? "border-foreground bg-secondary"
          : "border-border bg-background hover:border-foreground/30 hover:bg-secondary"
      )}
    >
      <ClipboardList className="h-5 w-5 text-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">Detailed Retro</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Custom questions, timeline, project tracking
        </p>
      </div>
    </button>
  </div>
);

const inputClass = "rounded-lg h-11 bg-background border-border";

const SimpleForm = () => {
  const navigate = useNavigate();
  const createRetro = useCreateRetro();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSimpleRetroFormValues>({
    resolver: zodResolver(createSimpleRetroSchema),
    defaultValues: { title: "", team_id: undefined },
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateSimpleRetroFormValues) => {
    try {
      const retro = await createRetro.mutateAsync({
        title: data.title.trim(),
        team_id: data.team_id,
        questions: [],
        format: "simple",
      });
      navigate(`/retros/${retro.id}`);
    } catch {
      // Toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="rounded-lg glass-card">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="retro-title">Title *</Label>
            <Input
              id="retro-title"
              {...register("title")}
              placeholder="e.g. Sprint 42 Retro"
              className={inputClass}
            />
            {errors.title && (
              <p className="text-sm text-destructive-foreground">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Team (optional)</Label>
            <TeamSelect
              value={watch("team_id")}
              onChange={(v) => setValue("team_id", v)}
            />
          </div>

          <div className="rounded-lg bg-secondary border border-border p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Columns will be created automatically:
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full border border-border">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Start
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full border border-border">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Stop
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full border border-border">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Continue
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={createRetro.isPending}
            className="w-full rounded-md h-11 font-semibold"
          >
            {createRetro.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              "Create Retro"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

const DetailedForm = () => {
  const navigate = useNavigate();
  const createRetro = useCreateRetro();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRetroFormValues>({
    resolver: zodResolver(createRetroSchema),
    defaultValues: {
      title: "",
      description: "",
      timeline_start: "",
      timeline_end: "",
      project_id: undefined,
      team_id: undefined,
      questions: DEFAULT_QUESTIONS.map((q) => ({ text: q })),
    },
    mode: "onBlur",
  });

  const questions = watch("questions");

  const handleQuestionsChange = (newQuestions: string[]) => {
    setValue(
      "questions",
      newQuestions.map((q) => ({ text: q })),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: CreateRetroFormValues) => {
    try {
      const retro = await createRetro.mutateAsync({
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        project_id: data.project_id,
        team_id: data.team_id,
        timeline_start: data.timeline_start,
        timeline_end: data.timeline_end,
        questions: data.questions.map((q) => q.text.trim()),
        format: "detailed",
      });
      navigate(`/retros/${retro.id}`);
    } catch {
      // Toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="rounded-lg glass-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="retro-title">Title *</Label>
            <Input
              id="retro-title"
              {...register("title")}
              placeholder="e.g. Sprint 42 Retro"
              className={inputClass}
            />
            {errors.title && (
              <p className="text-sm text-destructive-foreground">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retro-desc">Description</Label>
            <Textarea
              id="retro-desc"
              {...register("description")}
              placeholder="Optional description…"
              className="rounded-lg resize-none bg-background border-border"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <ProjectSelect
                value={watch("project_id")}
                onChange={(v) => setValue("project_id", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Team</Label>
              <TeamSelect
                value={watch("team_id")}
                onChange={(v) => setValue("team_id", v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Start Date & Time *
              </Label>
              <Input
                id="start-date"
                type="datetime-local"
                {...register("timeline_start")}
                className={inputClass}
              />
              {errors.timeline_start && (
                <p className="text-sm text-destructive-foreground">
                  {errors.timeline_start.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> End Date & Time *
              </Label>
              <Input
                id="end-date"
                type="datetime-local"
                {...register("timeline_end")}
                className={inputClass}
              />
              {errors.timeline_end && (
                <p className="text-sm text-destructive-foreground">
                  {errors.timeline_end.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <QuestionsEditor
              questions={questions.map((q) => q.text)}
              onChange={handleQuestionsChange}
            />
            {errors.questions && (
              <p className="text-sm text-destructive-foreground mt-1">
                {typeof errors.questions === "object" && "message" in errors.questions
                  ? errors.questions.message
                  : "Fix question errors above"}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={createRetro.isPending}
            className="w-full rounded-md h-11 font-semibold"
          >
            {createRetro.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              "Create Retro"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

const CreateRetroPage = () => {
  const [format, setFormat] = useState<RetroFormat>("simple");

  return (
    <div className="max-w-2xl mx-auto relative z-10">
      <SEO title="Create Retro" path="/retros/new" noindex />
      <h1 className="text-2xl font-bold text-foreground mb-6">Create Retro</h1>
      <FormatPicker value={format} onChange={setFormat} />
      {format === "simple" ? <SimpleForm /> : <DetailedForm />}
    </div>
  );
};

export default CreateRetroPage;
