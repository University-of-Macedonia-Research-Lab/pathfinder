"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { randomSlug, slugify } from "@/lib/utils";
import { emptyFloor } from "@/lib/map/empty-floor";
import { parseFloorMap } from "@/lib/map/schema";

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
  revalidatePath(`/dashboard/buildings/${building.id}`);
  redirect(`/dashboard/buildings/${building.id}/floors/${f.id}/edit`);
}

export async function saveFloorData(floorId: string, data: unknown) {
  const user = await requireUser();
  const floor = await prisma.floor.findFirst({
    where: { id: floorId, building: { ownerId: user.id } },
  });
  if (!floor) throw new Error("Floor not found");
  // Validate
  const parsed = parseFloorMap(data);
  await prisma.floor.update({
    where: { id: floorId },
    data: { data: JSON.stringify(parsed) },
  });
  revalidatePath(`/dashboard/buildings/${floor.buildingId}/floors/${floorId}/edit`);
  return { ok: true };
}

export async function deleteFloor(floorId: string) {
  const user = await requireUser();
  const floor = await prisma.floor.findFirst({
    where: { id: floorId, building: { ownerId: user.id } },
    select: { id: true, buildingId: true },
  });
  if (!floor) throw new Error("Floor not found");
  await prisma.floor.delete({ where: { id: floor.id } });
  revalidatePath(`/dashboard/buildings/${floor.buildingId}`);
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
  revalidatePath(`/dashboard/buildings/${buildingId}`);
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
  revalidatePath(`/dashboard/buildings/${buildingId}`);
}

export async function deleteBuilding(buildingId: string) {
  const user = await requireUser();
  const b = await prisma.building.findFirst({
    where: { id: buildingId, ownerId: user.id },
  });
  if (!b) throw new Error("Building not found");
  await prisma.building.delete({ where: { id: buildingId } });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
