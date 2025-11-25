"use client";

import { useState } from "react";
import { CommentRow, type FileRow } from "@/types/supabase";
import { useRealtimeFiles } from "../hooks/useRealtimeFiles";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";

export default function Home() {
  const [ uploads, setUploads ] = useState<FileRow[] | null>(null);

  useRealtimeFiles((newFile) => {
    setUploads(prev => [newFile, ...prev ?? []])
  })

  console.log("Files after realtime : ", uploads);
  return uploads;

}