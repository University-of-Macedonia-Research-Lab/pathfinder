import { prisma } from "@/lib/db";

// Public — the asset lives on a public viewer when the building is
// published. We could gate by ownership for unpublished buildings but it
// only matters for tracing references the user wouldn't want leaked. Add
// that check if/when the threat model needs it.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ assetId: string }> },
) {
  const { assetId } = await ctx.params;
  const asset = await prisma.floorAsset.findUnique({
    where: { id: assetId },
    select: { mimeType: true, bytes: true },
  });
  if (!asset) {
    return new Response("not found", { status: 404 });
  }
  // Prisma returns Bytes as Uint8Array (Node). Wrap in a Buffer so the
  // Response body is bytes and Content-Length comes out right.
  const buf = Buffer.from(asset.bytes as Uint8Array);
  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": asset.mimeType,
      "content-length": String(buf.byteLength),
      // Asset is keyed by id — immutable for the lifetime of the id.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
