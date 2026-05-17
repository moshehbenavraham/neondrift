import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MascotBuddy from "@/components/retrofly/MascotBuddy";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  useMascot?: boolean;
  mascotMood?: "idle" | "happy" | "celebrate";
}

const EmptyState = ({
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
  useMascot = false,
  mascotMood = "idle",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[200px] py-12 px-4">
      {useMascot ? (
        <div className="mb-4 relative">
          <div className="relative">
            <MascotBuddy mood={mascotMood} size="lg" />
          </div>
        </div>
      ) : (
        <span className="text-5xl mb-4" role="img">
          {emoji}
        </span>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild className="rounded-full w-full sm:w-auto font-semibold">
          <Link to={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
