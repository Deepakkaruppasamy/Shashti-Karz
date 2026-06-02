import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const folder = formData.get("folder") as string || "diagnostic-images";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabase.storage
            .from("vehicle-images")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (error) {
            console.error("Storage upload error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: filePath
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({
            error: error.message || "Failed to upload image"
        }, { status: 500 });
    }
}
