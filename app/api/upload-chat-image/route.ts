import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, GIF allowed" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    // Optimize image to WebP 85%
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "image/webp",
      },
      body: new Blob([new Uint8Array(optimizedBuffer)], { type: "image/webp" }),
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload to storage");
    }

    const { storageId } = await uploadResponse.json();

    // Save file record and get URL
    const result = await convex.mutation(api.files.saveFile, { storageId });

    return NextResponse.json({
      success: true,
      url: result.url,
      originalSize: file.size,
      optimizedSize: optimizedBuffer.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
