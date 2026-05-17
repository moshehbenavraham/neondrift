import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  message = "Something went wrong",
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[200px] py-12 px-4 border border-destructive/20 rounded-2xl bg-destructive/5">
      <span className="text-5xl mb-4" role="img">
        ⚠️
      </span>
      <h3 className="text-lg font-semibold text-foreground mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        Please try again or contact support if the issue persists.
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="rounded-full w-full sm:w-auto"
        >
          Try again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
