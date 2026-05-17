import { Skeleton } from "@/components/ui/skeleton";

const SkeletonActionItem = () => {
  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex items-start gap-3">
      {/* Checkbox placeholder */}
      <Skeleton className="h-5 w-5 rounded flex-shrink-0 mt-0.5" />

      <div className="flex-1 space-y-2">
        {/* Description */}
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />

        {/* Owner + date row */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonActionItem;
