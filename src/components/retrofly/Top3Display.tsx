import { useTop3 } from "@/hooks/useTop3";
import { useAuth } from "@/contexts/AuthContext";
import ProfileAvatar from "@/components/retrofly/ProfileAvatar";
import EmptyState from "@/components/retrofly/EmptyState";
import ErrorState from "@/components/retrofly/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

interface Top3DisplayProps {
  retroId: string;
}

const Top3Display = ({ retroId }: Top3DisplayProps) => {
  const { byUser, loading, error, refetch } = useTop3(retroId);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Failed to load Top 3 entries" onRetry={() => refetch()} />;
  }

  if (byUser.length === 0) {
    return (
      <EmptyState
        emoji="🌟"
        title="No Top 3 entries yet"
        description="Share yours to see what the team thinks!"
        useMascot
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      {byUser.map((group) => {
        const isMe = group.userId === user?.id;
        return (
          <div
            key={group.userId}
            className={`bg-card border rounded-2xl p-4 shadow-sm space-y-3 ${
              isMe ? "border-primary" : "border-border"
            }`}
          >
            <div className="flex items-center gap-2">
              <ProfileAvatar userId={group.userId} size="sm" showName={true} />
            </div>

            {group.do_again.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Do again 🔁
                </h5>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-0.5">
                  {group.do_again.map((e) => (
                    <li key={e.id}>{e.text}</li>
                  ))}
                </ol>
              </div>
            )}

            {group.do_differently.length > 0 && (
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Do differently 🔄
                </h5>
                <ol className="list-decimal list-inside text-sm text-foreground space-y-0.5">
                  {group.do_differently.map((e) => (
                    <li key={e.id}>{e.text}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Top3Display;
