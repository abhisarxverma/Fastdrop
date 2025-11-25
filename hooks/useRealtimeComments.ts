
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CommentRow } from "@/types/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useRealtimeComments(fileId: string, onInsert: (comment: CommentRow) => void) {
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!fileId) return;

    const channel = supabase
      .channel(`comments-${fileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `file_id=eq.${fileId}`,
        },
        (payload: RealtimePostgresChangesPayload<CommentRow>) => {
          onInsert(payload.new as CommentRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fileId, onInsert, supabase]);
}
