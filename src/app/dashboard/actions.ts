"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { randomSlug, slugify } from "@/lib/utils";
import { emptyFloor } from "@/lib/map/empty-floor";
import { parseFloorMap } from "@/lib/map/schema";

/**
 * Revalidate every surface that renders a building's data: the dashboard
 * list and the building detail page, plus — when the building is published
 * — the public viewer and its nested floor pages (the "layout" scope clears
 * the whole `/p/{slug}` subtree). Call this after any building/floor write.
 */
function revalidateBuilding(buildingId: string, publicSlug?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/buildings/${buildingId}`);
  if (publicSlug) {
    revalidatePath(`/p/${publicSlug}`, "layout");
  }
}

const CreateBuilding = z.object({
  nameEn: z.string().min(1).max(120),
  nameEl: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
});

export async function createBuilding(formData: FormData) {
  const user = await requireUser();
  const parsed = CreateBuilding.parse({
    nameEn: formData.get("nameEn"),
    nameEl: formData.get("nameEl"),
    description: formData.get("description") || undefined,
  });

  let slug = slugify(parsed.nameEn);
  // Ensure uniqueness
  while (await prisma.building.findUnique({ where: { slug } })) {
    slug = `${slugify(parsed.nameEn)}-${randomSlug(4)}`;
  }

  const b = await prisma.building.create({
    data: {
      ownerId: user.id,
      slug,
      nameEn: parsed.nameEn,
      nameEl: parsed.nameEl,
      description: parsed.description,
    },
  });
  revalidatePath("/dashboard");
  redirect(`/dashboard/buildings/${b.id}`);
}

const CreateFloor = z.object({
  buildingId: z.string(),
  nameEn: z.string().min(1).max(120),
  nameEl: z.string().min(1).max(120),
  level: z.coerce.number().int(),
});

export async function createFloor(formData: FormData) {
  const user = await requireUser();
  const parsed = CreateFloor.parse({
    buildingId: formData.get("buildingId"),
    nameEn: formData.get("nameEn"),
    nameEl: formData.get("nameEl"),
    level: formData.get("level"),
  });

  const building = await prisma.building.findFirst({
    where: { id: parsed.buildingId, ownerId: user.id },
  });
  if (!building) throw new Error("Building not found");

  let slug = slugify(parsed.nameEn);
  while (
    await prisma.floor.findFirst({
      where: { buildingId: building.id, slug },
    })
  ) {
    slug = `${slugify(parsed.nameEn)}-${randomSlug(3)}`;
  }

  const floorMap = emptyFloor({
    buildingSlug: building.slug,
    floorSlug: slug,
    level: parsed.level,
    nameEn: parsed.nameEn,
    nameEl: parsed.nameEl,
  });

  const f = await prisma.floor.create({
    data: {
      buildingId: building.id,
      slug,
      level: parsed.level,
      nameEn: parsed.nameEn,
      nameEl: parsed.nameEl,
      data: JSON.stringify(floorMap),
    },
  });
  revalidateBuilding(building.id, building.publicSlug);
  redirect(`/dashboard/buildings/${building.id}/floors/${f.id}/edit`);
}

export async function saveFloorData(floorId: string, data: unknown) {
  const user = await requireUser();
  const floor = await prisma.floor.findFirst({
    where: { id: floorId, building: { ownerId: user.id } },
    include: { building: { select: { publicSlug: true } } },
  });
  if (!floor) throw new Error("Floor not found");
  // Validate
  const parsed = parseFloorMap(data);
  await prisma.floor.update({
    where: { id: floorId },
    data: { data: JSON.stringify(parsed) },
  });
  // Saving geometry changes the floor stats on the building page and the
  // rendered map on the public viewer, so revalidate the whole building.
  revalidateBuilding(floor.buildingId, floor.building.publicSlug);
  revalidatePath(`/dashboard/buildings/${floor.buildingId}/floors/${floorId}/edit`);
  return { ok: true };
}

const UpdateFloor = z.object({
  id: z.string(),
  nameEn: z.string().min(1).max(120),
  nameEl: z.string().min(1).max(120),
  level: z.coerce.number().int(),
  slug: z
    .string()
    .max(80)
    .transform((v) => v.trim())
    .refine((v) => v === "" || /^[a-z0-9][a-z0-9-]*[a-z0-9]?$/.test(v), {
      message: "Use lowercase letters, digits, and hyphens only",
    }),
});

export async function updateFloor(formData: FormData) {
  const user = await requireUser();
  const parsed = UpdateFloor.parse({
    id: formData.get("id"),
    nameEn: formData.get("nameEn"),
    nameEl: formData.get("nameEl"),
    level: formData.get("level"),
    slug: formData.get("slug") ?? "",
  });

  const existing = await prisma.floor.findFirst({
    where: { id: parsed.id, building: { ownerId: user.id } },
    include: { building: { select: { publicSlug: true } } },
  });
  if (!existing) throw new Error("Floor not found");

  // Resolve the slug: keep current if blank; otherwise validate uniqueness
  // within this building (floor slugs are unique per building, not globally).
  let slug = existing.slug;
  if (parsed.slug && parsed.slug !== existing.slug) {
    const clash = await prisma.floor.findFirst({
      where: {
        buildingId: existing.buildingId,
        slug: parsed.slug,
        NOT: { id: existing.id },
      },
    });
    if (clash) {
      throw new Error("Another floor in this building already uses that slug");
    }
    slug = parsed.slug;
  }

  await prisma.floor.update({
    where: { id: existing.id },
    data: {
      nameEn: parsed.nameEn,
      nameEl: parsed.nameEl,
      level: parsed.level,
      slug,
    },
  });

  revalidateBuilding(existing.buildingId, existing.building.publicSlug);
  revalidatePath(`/dashboard/buildings/${existing.buildingId}/floors/${existing.id}/edit`);
}

export async function deleteFloor(floorId: string) {
  const user = await requireUser();
  const floor = await prisma.floor.findFirst({
    where: { id: floorId, building: { ownerId: user.id } },
    select: {
      id: true,
      buildingId: true,
      building: { select: { publicSlug: true } },
    },
  });
  if (!floor) throw new Error("Floor not found");
  await prisma.floor.delete({ where: { id: floor.id } });
  revalidateBuilding(floor.buildingId, floor.building.publicSlug);
}

const UpdateBuilding = z.object({
  id: z.string(),
  nameEn: z.string().min(1).max(120),
  nameEl: z.string().min(1).max(120),
  description: z
    .string()
    .max(500)
    .transform((v) => (v.trim() === "" ? null : v))
    .nullable(),
  publicSlug: z
    .string()
    .max(80)
    .transform((v) => v.trim())
    // Allow blank → keep current value (handled below). When provided, must
    // be url-safe-ish: lowercase letters, digits, hyphens.
    .refine((v) => v === "" || /^[a-z0-9][a-z0-9-]*[a-z0-9]?$/.test(v), {
      message: "Use lowercase letters, digits, and hyphens only",
    }),
});

export async function updateBuilding(formData: FormData) {
  const user = await requireUser();
  const parsed = UpdateBuilding.parse({
    id: formData.get("id"),
    nameEn: formData.get("nameEn"),
    nameEl: formData.get("nameEl"),
    description: formData.get("description") ?? "",
    publicSlug: formData.get("publicSlug") ?? "",
  });

  const existing = await prisma.building.findFirst({
    where: { id: parsed.id, ownerId: user.id },
  });
  if (!existing) throw new Error("Building not found");

  // Resolve the public slug: if the user left it blank, keep the current one
  // (or generate one when the building is currently unpublished and has no
  // slug yet). If they typed a new value, verify uniqueness across buildings.
  let publicSlug = existing.publicSlug;
  if (parsed.publicSlug && parsed.publicSlug !== existing.publicSlug) {
    const clash = await prisma.building.findFirst({
      where: { publicSlug: parsed.publicSlug, NOT: { id: existing.id } },
    });
    if (clash) {
      throw new Error("That public URL is already taken by another building");
    }
    publicSlug = parsed.publicSlug;
  }

  // Re-derive the internal slug from the English name so a renamed building
  // (or one that fell back to "untitled" because of a Greek-only name) keeps
  // a sensible slug. Internal slug is display-only + unique; dashboard routes
  // use the building id, so changing it is safe.
  let slug = existing.slug;
  const derived = slugify(parsed.nameEn);
  if (derived !== existing.slug) {
    slug = derived;
    while (
      await prisma.building.findFirst({
        where: { slug, NOT: { id: existing.id } },
      })
    ) {
      slug = `${derived}-${randomSlug(4)}`;
    }
  }

  await prisma.building.update({
    where: { id: existing.id },
    data: {
      nameEn: parsed.nameEn,
      nameEl: parsed.nameEl,
      description: parsed.description,
      slug,
      publicSlug,
    },
  });

  revalidateBuilding(existing.id, publicSlug);
  // If the public slug itself changed, refresh the old URL too so a stale
  // render at the previous slug doesn't linger after the rename.
  if (existing.publicSlug && existing.publicSlug !== publicSlug) {
    revalidatePath(`/p/${existing.publicSlug}`, "layout");
  }
}

export async function publishBuilding(buildingId: string) {
  const user = await requireUser();
  const b = await prisma.building.findFirst({
    where: { id: buildingId, ownerId: user.id },
  });
  if (!b) throw new Error("Building not found");

  let publicSlug = b.publicSlug;
  if (!publicSlug) {
    publicSlug = `${b.slug}-${randomSlug(4)}`;
    while (await prisma.building.findUnique({ where: { publicSlug } })) {
      publicSlug = `${b.slug}-${randomSlug(4)}`;
    }
  }

  await prisma.building.update({
    where: { id: buildingId },
    data: { status: "published", publishedAt: new Date(), publicSlug },
  });
  revalidateBuilding(buildingId, publicSlug);
}

export async function unpublishBuilding(buildingId: string) {
  const user = await requireUser();
  const b = await prisma.building.findFirst({
    where: { id: buildingId, ownerId: user.id },
  });
  if (!b) throw new Error("Building not found");
  await prisma.building.update({
    where: { id: buildingId },
    data: { status: "draft" },
  });
  // Pass the slug so the now-unpublished public page is cleared too.
  revalidateBuilding(buildingId, b.publicSlug);
}

export async function deleteBuilding(buildingId: string) {
  const user = await requireUser();
  const b = await prisma.building.findFirst({
    where: { id: buildingId, ownerId: user.id },
  });
  if (!b) throw new Error("Building not found");
  await prisma.building.delete({ where: { id: buildingId } });
  revalidatePath("/dashboard");
  if (b.publicSlug) revalidatePath(`/p/${b.publicSlug}`, "layout");
  redirect("/dashboard");
}
