import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import type { FileRow } from "@/types/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useRealtimeFiles(onInsert: (data: FileRow) => void) {
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const channel = supabase
      .channel("files-insert-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "files" },
        (payload: RealtimePostgresChangesPayload<FileRow>) => {
          onInsert(payload.new as FileRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert, supabase]);
}

