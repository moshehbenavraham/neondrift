import { Skeleton } from "@/components/ui/skeleton";

const SkeletonResponseCard = () => {
  return (
    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)] space-y-3">
      {/* Text area */}
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-2/3 rounded" />

      {/* Avatar + time + upvote row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonResponseCard;
