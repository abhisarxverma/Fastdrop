import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const RADIUS = 0.05; // km

export async function GET(req: Request){

    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (!lat || !lng) {
        return NextResponse.json(
            { error: "Please provide geo-coordinates"},
            { status: 400 }
        )
    }

    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
    .from("files")
    .select("*")
    .gte("latitude", lat - RADIUS)
    .lte("latitude", lat + RADIUS)
    .gte("longitude", lng - RADIUS)
    .lte("longitude", lng + RADIUS)
    .gte("expires_at", new Date().toISOString())
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

    if (error) {
        console.log("Error in getting files : ", error);
        return NextResponse.json(
            { error: "Files query failed" },
            { status: 500 }
        )
    }

    return NextResponse.json(
        { files: data },
        { status: 200 }
    )
}