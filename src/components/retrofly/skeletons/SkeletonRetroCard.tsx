import { Skeleton } from "@/components/ui/skeleton";

const SkeletonRetroCard = () => {
  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-3">
      {/* Title + badge row */}
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-12 rounded-full flex-shrink-0" />
      </div>

      {/* Chips row */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>

      {/* Date + participants row */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-8 rounded" />
      </div>
    </div>
  );
};

export default SkeletonRetroCard;
