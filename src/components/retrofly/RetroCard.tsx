import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Users } from "lucide-react";
import type { DashboardRetro } from "@/hooks/useDashboardRetros";
import { motion } from "framer-motion";

interface RetroCardProps {
  retro: DashboardRetro;
  index: number;
}

const RetroCard = ({ retro, index }: RetroCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/retros/${retro.id}`)}
      className="bg-card border-l-[3px] border border-border rounded-md p-4 cursor-pointer group hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 active:scale-[0.99]"
      style={{ borderLeftColor: retro.status === "open" ? "hsl(142, 71%, 45%)" : "hsl(0, 0%, 78%)" }}
    >
      <h3 className="text-base font-semibold text-foreground tracking-[-0.02em] mb-2">
        {retro.title}
      </h3>

      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
          {retro.format === "simple" ? "Simple" : "Detailed"}
        </span>
        {retro.team_name && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">
            {retro.team_name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{format(new Date(retro.created_at), "MMM d, yyyy")}</span>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span className="tabular-nums">{retro.participant_count}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RetroCard;
