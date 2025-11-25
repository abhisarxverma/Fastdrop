import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAnonymousAuth() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      }
    });
  }, []);
}
