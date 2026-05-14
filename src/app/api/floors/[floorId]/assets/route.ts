import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { presignUpload, spacesConfig } from "@/lib/storage";

/**
 * Floor asset upload endpoint, two modes:
 *
 *   1. **Spaces (preferred)** — POST JSON `{ fileName, fileType, size? }`.
 *      Returns `{ mode: "presigned", signedUrl, publicUrl }`. The browser
 *      PUTs the file bytes directly to `signedUrl` and then drops
 *      `publicUrl` into FloorMap.background.url.
 *
 *   2. **DB fallback** — POST multipart `file=...`. The bytes are written
 *      into a `FloorAsset` row and served via `/api/assets/[id]`. Used
 *      automatically when Spaces env vars aren't configured.
 *
 * Mode is chosen from the request's Content-Type, so the client doesn't
 * need to ask first.
 */

const MAX_BYTES = 16 * 1024 * 1024; // 16 MB for both paths
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
]);

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ floorId: string }> },
) {
  const user = await requireUser();
  const { floorId } = await ctx.params;

  const floor = await prisma.floor.findFirst({
    where: { id: floorId, building: { ownerId: user.id } },
    select: { id: true, buildingId: true },
  });
  if (!floor) {
    return Response.json({ error: "floor_not_found" }, { status: 404 });
  }

  const ct = request.headers.get("content-type") ?? "";

  // JSON → presigned-URL flow (only available when Spaces is configured)
  if (ct.includes("application/json")) {
    const body = (await request.json()) as Partial<{
      fileName: string;
      fileType: string;
      size: number;
    }>;
    if (!body.fileName || !body.fileType) {
      return Response.json({ error: "missing_fields" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(body.fileType)) {
      return Response.json(
        { error: "unsupported_type", got: body.fileType },
        { status: 415 },
      );
    }
    if (typeof body.size === "number" && body.size > MAX_BYTES) {
      return Response.json(
        { error: "file_too_large", maxBytes: MAX_BYTES },
        { status: 413 },
      );
    }
    if (!spacesConfig()) {
      return Response.json(
        { error: "spaces_not_configured" },
        { status: 503 },
      );
    }
    const presigned = await presignUpload({
      fileName: body.fileName,
      fileType: body.fileType,
      pathParts: ["buildings", floor.buildingId, "floors", floor.id],
    });
    if (!presigned) {
      return Response.json({ error: "presign_failed" }, { status: 500 });
    }
    return Response.json({ mode: "presigned", ...presigned });
  }

  // Multipart → DB fallback
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "file_too_large", maxBytes: MAX_BYTES },
      { status: 413 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "unsupported_type", got: file.type },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const asset = await prisma.floorAsset.create({
    data: { floorId: floor.id, mimeType: file.type, bytes: buffer },
    select: { id: true, mimeType: true },
  });
  return Response.json({
    mode: "stored",
    id: asset.id,
    url: `/api/assets/${asset.id}`,
    mimeType: asset.mimeType,
  });
}
