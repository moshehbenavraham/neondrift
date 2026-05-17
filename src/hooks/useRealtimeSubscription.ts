import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeSubscriptionOptions {
  table: string;
  filterColumn?: string;
  filterValue?: string;
  onChange: () => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = ({
  table,
  filterColumn,
  filterValue,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (filterColumn && !filterValue) return;

    const channelName = filterValue
      ? `${table}-${filterColumn}-${filterValue}`
      : `${table}-all-${Date.now()}`;

    const filter =
      filterColumn && filterValue
        ? `${filterColumn}=eq.${filterValue}`
        : undefined;

    const channelConfig: any = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) channelConfig.filter = filter;

    channelRef.current = supabase
      .channel(channelName)
      .on("postgres_changes", channelConfig, () => {
        onChange();
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filterColumn, filterValue, onChange, enabled]);
};
