import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateResponse } from "@/hooks/useResponses";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import { addResponseSchema, type AddResponseFormValues } from "@/lib/validations";

const SENTIMENTS = [
  { value: 1, emoji: "😢" },
  { value: 2, emoji: "😕" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😄" },
];

interface AddResponseFormProps {
  retroId: string;
  questionId: string;
  isClosed: boolean;
  compact?: boolean;
  accentColorClass?: string;
  onSubmitSuccess?: () => void;
}

const AddResponseForm = ({ retroId, questionId, isClosed, compact = false, accentColorClass, onSubmitSuccess }: AddResponseFormProps) => {
  const createResponse = useCreateResponse();
  const [expanded, setExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddResponseFormValues>({
    resolver: zodResolver(addResponseSchema),
    defaultValues: { text: "", sentiment: null, is_action_item: false },
    mode: "onSubmit",
  });

  const sentiment = watch("sentiment");
  const isActionItem = watch("is_action_item");

  if (isClosed) return null;

  const onSubmit = async (data: AddResponseFormValues) => {
    try {
      await createResponse.mutateAsync({
        retro_id: retroId,
        question_id: questionId,
        text: data.text.trim(),
        sentiment: data.sentiment,
        is_action_item: data.is_action_item,
      });
      reset();
      if (compact) setExpanded(false);
      onSubmitSuccess?.();
    } catch {
      // Toast handled by hook
    }
  };

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1.5 rounded-md transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        New
      </button>
    );
  }

  if (compact) {
    return (
      <div className="bg-background border border-border rounded-lg p-2.5 space-y-2 shadow-sm">
        <Textarea
          {...register("text")}
          placeholder="Type your response…"
          className="rounded-lg resize-none text-sm min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground"
          rows={2}
          autoFocus
        />
        {errors.text && (
          <p className="text-xs text-destructive-foreground">{errors.text.message}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {SENTIMENTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setValue("sentiment", sentiment === s.value ? null : s.value)}
                className={`text-sm w-7 h-7 rounded-full transition-all ${
                  sentiment === s.value ? "bg-secondary ring-1 ring-foreground scale-110" : "hover:bg-secondary"
                }`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
              <Checkbox
                checked={isActionItem}
                onCheckedChange={(v) => setValue("is_action_item", v === true)}
                className="h-3.5 w-3.5 border-border"
              />
              Action
            </label>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={createResponse.isPending}
              size="sm"
              className="rounded-full h-7 text-xs px-3"
            >
              {createResponse.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { reset(); setExpanded(false); }}
              className="rounded-full h-7 text-xs px-2"
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full-size form
  return (
    <div className="glass-card rounded-lg p-4 space-y-3">
      <Textarea
        {...register("text")}
        placeholder="Add your response…"
        className="rounded-lg resize-none bg-background border-border"
        rows={2}
      />
      {errors.text && (
        <p className="text-sm text-destructive-foreground">{errors.text.message}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {SENTIMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setValue("sentiment", sentiment === s.value ? null : s.value)}
              className={`text-lg w-11 h-11 rounded-full transition-all ${
                sentiment === s.value ? "bg-secondary ring-2 ring-foreground scale-110" : "hover:bg-secondary"
              }`}
              title={`Sentiment ${s.value}`}
            >
              {s.emoji}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={isActionItem}
              onCheckedChange={(v) => setValue("is_action_item", v === true)}
              className="h-4 w-4 border-border"
            />
            Action item
          </label>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={createResponse.isPending}
            size="sm"
            className="rounded-full"
          >
            {createResponse.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddResponseForm;
