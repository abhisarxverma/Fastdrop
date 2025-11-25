// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Filter } from "bad-words";

const filter = new Filter();

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { file_id, content } = body;

        if (!file_id || !content) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Profanity check
        if (filter.isProfane(content)) {
            return NextResponse.json(
                { error: "Inappropriate content detected" },
                { status: 400 }
            );
        }

        const supabase = await getSupabaseServerClient();

        const { data, error } = await supabase
            .from("comments")
            .insert({
                file_id,
                content,
            })
            .select()
            .single();

        if (error) {
            console.log("Error in comment insertion : ", error);
            return NextResponse.json(
                { error: "Database insert failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comment: data });
    } catch (err) {
        console.log("Error in posting comment : ", err);
        return NextResponse.json(
            { error: "Invalid JSON" },
            { status: 400 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const file_id = searchParams.get("file_id");

        if (!file_id) {
            return NextResponse.json(
                { error: "file_id is required" },
                { status: 400 }
            );
        }

        const supabase = await getSupabaseServerClient();

        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .eq("file_id", file_id)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json(
                { error: "Database fetch failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({ comments: data });
    } catch {
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
