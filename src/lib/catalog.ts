import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

async function fetchCuisineCatalog() {
  const [cuisines, dishes] = await Promise.all([
    prisma.cuisine.findMany({
      orderBy: [{ region: "asc" }, { name: "asc" }],
      select: { id: true, slug: true, name: true, region: true },
    }),
    prisma.dish.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        hindiName: true,
        cuisineId: true,
        category: true,
        dietType: true,
        defaultStorage: true,
        typicalSafeWindowHours: true,
        perishability: true,
        description: true,
      },
    }),
  ]);

  return { cuisines, dishes };
}

/** Cached Indian cuisine/dish catalog — invalidated via revalidateTag("cuisine-catalog"). */
export const getCuisineCatalog = unstable_cache(
  fetchCuisineCatalog,
  ["cuisine-catalog-v1"],
  { revalidate: 3600, tags: ["cuisine-catalog"] },
);
