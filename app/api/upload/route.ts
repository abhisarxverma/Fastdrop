import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Filter } from "bad-words";
import { validateExpiry } from "@/lib/utils/validators";

const filter = new Filter();

export async function POST(req: Request) {
    const contentType = req.headers.get("content-type") || "";
    const supabase = await getSupabaseServerClient();

    const { data: auth } = await supabase.auth.getSession();

    if (!auth.session) {
        const { error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
            console.log("Anonymous auth failed:", anonError);
            return NextResponse.json(
                { error: "Authentication failed" },
                { status: 500 }
            );
        }
    }
    
    const isFileUpload = contentType.includes("multipart/form-data");

    if (isFileUpload) {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        const lat = form.get("lat");
        const lng = form.get("lng");
        const expires_at = form.get("expires_at");

        if (!file) {
            return NextResponse.json(
                { error: "File is missing" },
                { status: 400 }
            );
        }

        if (!lat || !lng || !expires_at) {
            return NextResponse.json(
                { error: "Missing metadata fields" },
                { status: 400 }
            );
        }

        if (typeof expires_at == "string") {
            const expiryValidation = validateExpiry(expires_at);
            if (!expiryValidation.valid) {
                return NextResponse.json(
                    { error: expiryValidation.reason },
                    { status: 400 }
                )
            }
        }

        const ext = file.name.split(".").pop();
        const filename = `${crypto.randomUUID()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
            .from("shared-files")
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.log("Error in storage upload : ", uploadError);
            return NextResponse.json(
                { error: "Storage upload failed" },
                { status: 500 }
            );
        }

        const { data: urlData } = supabase.storage
            .from("shared-files")
            .getPublicUrl(filename);

        const fileUrl = urlData.publicUrl;

        const { data: inserted, error: dbError } = await supabase
            .from("files")
            .insert({
                url: fileUrl,
                type: "file",
                name: filename,
                content: null,
                mime_type: file.type,
                size: file.size,
                latitude: Number(lat),
                longitude: Number(lng),
                expires_at: new Date(expires_at as unknown as string).toISOString(),
                deleted_at: null,
            })
            .select()
            .single();

        if (dbError) {
            console.log("Error in database insertion after storage upload : ", dbError);
            return NextResponse.json(
                { error: "Database insert failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "File metadata received successfully",
            filename: inserted.name,
            size: inserted.size,
            type: inserted.type,
            lat,
            lng,
            user_id: inserted.user_id,
            expires_at,
        });
    }

    const body = await req.json();

    const text = body.text as string | null;
    const name = body.title as string | null;
    const lat = body.lat;
    const lng = body.lng;
    const expires_at = body.expires_at;

    if (!text) {
        return NextResponse.json(
            { error: "File is missing" },
            { status: 400 }
        );
    }

    if (!name || !lat || !lng || !expires_at) {
        return NextResponse.json(
            { error: "Missing metadata fields" },
            { status: 400 }
        );
    }

    if (filter.isProfane(text) || filter.isProfane(name)) {
        return NextResponse.json(
            { error: "Message contains inappropriate language" },
            { status: 400 }
        );
    }

    const expiryValidation = validateExpiry(expires_at);
    if (!expiryValidation.valid) {
        return NextResponse.json(
            { error: expiryValidation.reason },
            { status: 400 }
        )
    }

    const { data: inserted, error: dbError } = await supabase
        .from("files")
        .insert({
            url: null,
            type: "text",
            name: name,
            content: text,
            mime_type: "application/text",
            size: null,
            latitude: Number(lat),
            longitude: Number(lng),
            expires_at: new Date(expires_at as string).toISOString(),
            deleted_at: null,
        })
        .select()
        .single();

    if (dbError) {
        return NextResponse.json(
            { error: "Database insert failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: "File metadata received successfully",
        text: inserted.content,
        name: inserted.name,
        user_id: inserted.user_id,
        lat,
        lng,
        expires_at,
    });
}
