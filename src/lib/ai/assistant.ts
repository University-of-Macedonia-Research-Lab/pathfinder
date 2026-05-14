/**
 * Pathfinder AI assistant.
 *
 * Wraps Claude Opus 4.7 with two tools that hand off to the existing
 * pathfinder/search code:
 *   - `find_room` searches all floors of the current building.
 *   - `find_route` runs multi-floor pathfinding and returns a path that
 *     can span multiple floors via elevators or stairs (gated by the
 *     accessibility profile).
 *
 * The whole building's JSON (every floor) is injected into the system
 * prompt with a cache breakpoint, so the second turn of any conversation
 * reads the building data from cache (~10× cheaper).
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { FloorMap } from "@/lib/map/schema";
import { PROFILES, type Profile } from "@/lib/map/pathfind";
import {
  findMultiFloorRouteBetweenRooms,
  type MultiFloorPath,
} from "@/lib/map/multi-pathfind";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type AssistantResponse = {
  text: string;
  /** Multi-floor route the assistant chose, if any. */
  path: MultiFloorPath | null;
  /** Profile id used for the last successful `find_route` call, if any. */
  profileId: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number | null;
    cache_read_input_tokens: number | null;
  };
};

const SYSTEM_INTRO =
  "You are Pathfinder's wayfinding assistant. You help visitors navigate an indoor accessibility map " +
  "of a multi-floor building. Always call `find_route` to compute a path before describing one, never " +
  "invent room ids, node ids, or routes. Use `find_room` first when the user names a destination by " +
  "code or partial name. Always pass both `floor` and `room_id` when calling `find_route`. " +
  "If the user mentions a wheelchair, mobility issue, or stairs they want to avoid, pass " +
  '`profile: "wheelchair"`. Reply in 1–3 short sentences. Describe the key steps in plain English ' +
  "(entrance → corridor → elevator to first floor → room). If no route exists for the chosen " +
  "profile, say so and suggest a different profile if relevant.";

function makeTools(
  floors: FloorMap[],
  captured: { path: MultiFloorPath | null; profileId: string | null },
) {
  const findRoom = betaZodTool({
    name: "find_room",
    description:
      "Search rooms across every floor of the building by code, English name, or Greek name. " +
      "Returns up to 8 matches, each with the floor it sits on, the room id, code, kind, and name.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("Free-text search, a room code, partial name, or kind (e.g. 'lab')."),
    }),
    run: async ({ query }) => {
      const q = query.toLowerCase();
      const matches: Array<{
        floor: string;
        floor_name: string;
        id: string;
        code: string | null;
        name_en: string;
        name_el: string;
        kind: string;
      }> = [];
      for (const floor of floors) {
        for (const r of floor.rooms) {
          if (r.kind === "corridor") continue;
          const hit =
            r.code?.toLowerCase().includes(q) ||
            r.name.en.toLowerCase().includes(q) ||
            r.name.el.toLowerCase().includes(q) ||
            r.kind.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q);
          if (!hit) continue;
          matches.push({
            floor: floor.floorSlug,
            floor_name: floor.name.en,
            id: r.id,
            code: r.code ?? null,
            name_en: r.name.en,
            name_el: r.name.el,
            kind: r.kind,
          });
          if (matches.length >= 8) break;
        }
        if (matches.length >= 8) break;
      }
      return JSON.stringify({ matches });
    },
  });

  const findRoute = betaZodTool({
    name: "find_route",
    description:
      "Compute the shortest accessible route between two rooms in this building. " +
      "Both rooms must be specified by floor slug + room id (use find_room first if you don't know them). " +
      "Returns the multi-floor path as a list of segments, where each segment is a sequence of node ids " +
      "on a single floor; consecutive segments imply a cross-floor transition (elevator or stairs). " +
      "Returns ok=false if no route exists for the chosen profile.",
    inputSchema: z.object({
      from_floor: z.string().describe("Floor slug of the starting room."),
      from_room_id: z.string().describe("Source room id."),
      to_floor: z.string().describe("Floor slug of the destination room."),
      to_room_id: z.string().describe("Destination room id."),
      profile: z
        .enum(["default", "wheelchair", "visually_impaired"])
        .optional()
        .describe(
          "Defaults to 'default'. Use 'wheelchair' if mobility constraints are mentioned.",
        ),
    }),
    run: async ({ from_floor, from_room_id, to_floor, to_room_id, profile }) => {
      const p: Profile = PROFILES[profile ?? "default"] ?? PROFILES.default;
      const result = findMultiFloorRouteBetweenRooms(
        floors,
        { floor: from_floor, room: from_room_id },
        { floor: to_floor, room: to_room_id },
        p,
      );
      if (!result) {
        return JSON.stringify({
          ok: false,
          reason: "no_route_for_profile",
          profile: p.id,
        });
      }
      captured.path = result;
      captured.profileId = p.id;
      return JSON.stringify({
        ok: true,
        profile: p.id,
        cost: Number(result.cost.toFixed(2)),
        segments: result.segments.map((s) => ({
          floor: s.floorSlug,
          nodes: s.nodes,
          steps: Math.max(0, s.nodes.length - 1),
        })),
        floor_changes: Math.max(0, result.segments.length - 1),
      });
    },
  });

  return [findRoom, findRoute];
}

function buildSystem(
  floors: FloorMap[],
  currentFloorSlug: string,
  lang: "en" | "el",
): Anthropic.Beta.BetaTextBlockParam[] {
  // The building JSON is the bulky, stable part of the prefix; cache it.
  const langInstruction =
    lang === "el"
      ? "Reply to the user in Greek. Use Greek room names and natural Greek phrasing."
      : "Reply to the user in English.";
  return [
    { type: "text", text: SYSTEM_INTRO },
    {
      type: "text",
      text:
        "Building data (JSON, all floors). Use this to look up floor slugs and room ids " +
        "before calling tools:\n" +
        JSON.stringify(floors),
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text:
        `The user is currently looking at floor "${currentFloorSlug}". When they say "here" or "this floor" without naming one, assume that. ` +
        langInstruction,
    },
  ];
}

export async function askAssistant(
  floors: FloorMap[],
  currentFloorSlug: string,
  history: AssistantMessage[],
  userMessage: string,
  lang: "en" | "el" = "en",
): Promise<AssistantResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set; add it to .env.local to enable the assistant.",
    );
  }

  const client = new Anthropic();
  const captured: { path: MultiFloorPath | null; profileId: string | null } = {
    path: null,
    profileId: null,
  };
  const tools = makeTools(floors, captured);

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const finalMessage = await client.beta.messages.toolRunner({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    system: buildSystem(floors, currentFloorSlug, lang),
    tools,
    messages,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
  });

  const text = finalMessage.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    text,
    path: captured.path,
    profileId: captured.profileId,
    usage: {
      input_tokens: finalMessage.usage.input_tokens,
      output_tokens: finalMessage.usage.output_tokens,
      cache_creation_input_tokens:
        finalMessage.usage.cache_creation_input_tokens ?? null,
      cache_read_input_tokens:
        finalMessage.usage.cache_read_input_tokens ?? null,
    },
  };
}
