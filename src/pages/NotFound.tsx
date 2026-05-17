import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import EmptyState from "@/components/retrofly/EmptyState";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  // Wait for auth to resolve before deciding where to send the visitor — we
  // don't want signed-in users dumped on `/` and unauthenticated users
  // dumped on `/dashboard` (which just bounces them back through /login).
  const signedIn = !loading && !!user;
  const actionHref = signedIn ? "/dashboard" : "/";
  const actionLabel = signedIn ? "Go to dashboard" : "Back to home";

  return (
    <main
      aria-label="Page not found"
      className="min-h-screen flex items-center justify-center bg-background px-4"
    >
      <SEO
        title="Page not found"
        description="The page you're looking for doesn't exist."
        noindex
      />
      <EmptyState
        emoji="🤔"
        title="Page not found"
        description="The page you're looking for doesn't exist."
        actionLabel={loading ? undefined : actionLabel}
        actionHref={loading ? undefined : actionHref}
        useMascot
      />
    </main>
  );
};

export default NotFound;
