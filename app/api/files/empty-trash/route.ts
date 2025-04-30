import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trashedFiles = await db
      .select()
      .from(files)
      .where(and(eq(files.userId, userId), eq(files.isTrash, true)));

    if (!trashedFiles.length) {
      return NextResponse.json(
        { message: "No files in trash" },
        { status: 200 }
      );
    }

    const deletePromises = trashedFiles
      .filter((file) => !file.isFolder)
      .map(async (file) => {
        try {
          const urlWithoutQuery = file.fileUrl?.split("?")[0];
          const fileNameFromUrl = urlWithoutQuery?.split("/").pop();
          const fallbackName = file.path?.split("/").pop();
          const imagekitFileId = fileNameFromUrl || fallbackName;

          if (!imagekitFileId) return;

          try {
            const results = await imagekit.listFiles({
              name: imagekitFileId,
              limit: 1,
            });

            if (results?.length > 0) {
              const foundFile = results[0];
              if ("fileId" in foundFile) {
                await imagekit.deleteFile(foundFile.fileId);
              }
            } else {
              await imagekit.deleteFile(imagekitFileId);
            }
          } catch (err) {
            console.error("ImageKit delete fallback", err);
            await imagekit.deleteFile(imagekitFileId);
          }
        } catch (err) {
          console.error(`ImageKit error for file ${file.id}`, err);
        }
      });

    await Promise.allSettled(deletePromises);

    const deletedFiles = await db
      .delete(files)
      .where(and(eq(files.userId, userId), eq(files.isTrash, true)))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedFiles.length} trashed file(s)`,
    });
  } catch (error) {
    console.error("Error in DELETE /api/trash", error);
    return NextResponse.json(
      { error: "Failed to empty trash" },
      { status: 500 }
    );
  }
}
