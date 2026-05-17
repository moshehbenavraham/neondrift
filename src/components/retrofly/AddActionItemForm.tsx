import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateActionItem } from "@/hooks/useActionItems";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createActionItemSchema, type CreateActionItemFormValues } from "@/lib/validations";

interface AddActionItemFormProps {
  retroId: string;
  isClosed: boolean;
}

const AddActionItemForm = ({ retroId, isClosed }: AddActionItemFormProps) => {
  const createItem = useCreateActionItem();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateActionItemFormValues>({
    resolver: zodResolver(createActionItemSchema),
    defaultValues: { description: "", due_date: "", owner_id: null },
    mode: "onBlur",
  });

  if (isClosed) return null;

  const onSubmit = async (data: CreateActionItemFormValues) => {
    try {
      await createItem.mutateAsync({
        retro_id: retroId,
        description: data.description.trim(),
        due_date: data.due_date || null,
      });
      reset();
    } catch {
      // Toast handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
      <h4 className="text-sm font-semibold text-white">Add Action Item</h4>
      <Textarea
        {...register("description")}
        placeholder="Describe the action item..."
        className="rounded-xl resize-none bg-black/20 border-white/20 text-white placeholder:text-white/50"
        rows={2}
      />
      {errors.description && (
        <p className="text-sm text-red-400">{errors.description.message}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="date"
          {...register("due_date")}
          className="rounded-xl sm:w-44 bg-black/20 border-white/20 text-white"
          placeholder="Due date (optional)"
        />
        <Button
          type="submit"
          disabled={createItem.isPending}
          className="rounded-full rainbow-shimmer border-0 text-white"
        >
          {createItem.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Item
        </Button>
      </div>
    </form>
  );
};

export default AddActionItemForm;
