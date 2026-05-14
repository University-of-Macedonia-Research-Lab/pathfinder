import { z } from "zod";
import { askAssistant, type AssistantMessage } from "@/lib/ai/assistant";
import { prisma } from "@/lib/db";
import { parseFloorMap } from "@/lib/map/schema";

// The assistant API takes a building's public slug (the same slug used in
// /p/[publicSlug]) so it can be called from the public viewer without auth.
const RequestSchema = z.object({
  publicSlug: z.string().min(1),
  floor: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .max(20)
    .default([]),
  lang: z.enum(["en", "el"]).default("en"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const building = await prisma.building.findFirst({
    where: { publicSlug: parsed.data.publicSlug, status: "published" },
    include: { floors: { orderBy: { level: "asc" } } },
  });
  if (!building) {
    return Response.json({ error: "building_not_found" }, { status: 404 });
  }
  const floorRows = building.floors;
  if (!floorRows.some((f) => f.slug === parsed.data.floor)) {
    return Response.json({ error: "floor_not_found" }, { status: 404 });
  }

  const floors = floorRows.map((f) => parseFloorMap(JSON.parse(f.data)));

  try {
    const result = await askAssistant(
      floors,
      parsed.data.floor,
      parsed.data.history as AssistantMessage[],
      parsed.data.message,
      parsed.data.lang,
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    const status = message.includes("ANTHROPIC_API_KEY") ? 503 : 500;
    return Response.json({ error: message }, { status });
  }
}
