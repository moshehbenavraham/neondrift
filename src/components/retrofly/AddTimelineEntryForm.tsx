import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTimelineEntry } from "@/hooks/useTimelineEntries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { addTimelineEntrySchema, type AddTimelineEntryFormValues } from "@/lib/validations";

interface AddTimelineEntryFormProps {
  retroId: string;
  startDate: string | null;
  endDate: string | null;
  isClosed: boolean;
}

const AddTimelineEntryForm = ({
  retroId,
  startDate,
  endDate,
  isClosed,
}: AddTimelineEntryFormProps) => {
  const createEntry = useCreateTimelineEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddTimelineEntryFormValues>({
    resolver: zodResolver(addTimelineEntrySchema),
    defaultValues: { entry_date: "", entry_time: "", description: "" },
    mode: "onBlur",
  });

  if (isClosed) return null;

  // Extract date-only portions for min/max on native date input
  const minDate = startDate ? startDate.slice(0, 10) : undefined;
  const maxDate = endDate ? endDate.slice(0, 10) : undefined;

  const onSubmit = async (data: AddTimelineEntryFormValues) => {
    try {
      await createEntry.mutateAsync({
        retro_id: retroId,
        entry_date: data.entry_date,
        entry_time: data.entry_time || null,
        description: data.description.trim(),
      });
      reset();
    } catch {
      // Toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pt-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="sm:w-48">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              {...register("entry_date")}
              min={minDate}
              max={maxDate}
              className="rounded-xl pl-9 bg-white/[0.12] backdrop-blur-xl border-white/[0.2] text-foreground"
            />
          </div>
          {errors.entry_date && (
            <p className="text-sm text-destructive mt-1">{errors.entry_date.message}</p>
          )}
        </div>
        <div className="sm:w-40">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="time"
              {...register("entry_time")}
              className="rounded-xl pl-9 bg-white/[0.12] backdrop-blur-xl border-white/[0.2] text-foreground"
              placeholder="Time (optional)"
            />
          </div>
        </div>
        <div className="flex-1">
          <Input
            {...register("description")}
            placeholder="What happened on this day?"
            className="rounded-xl bg-white/[0.12] backdrop-blur-xl border-white/[0.2] text-foreground placeholder:text-muted-foreground"
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={createEntry.isPending}
          className="rounded-full"
        >
          {createEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Entry
        </Button>
      </div>
    </form>
  );
};

export default AddTimelineEntryForm;
