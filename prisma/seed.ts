import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { CUISINES, DISHES } from "./data/indian-cuisines";

const prisma = new PrismaClient();

const INDIAN_DONORS = [
  {
    email: "donor@zerospoil.dev",
    name: "Green Kitchen Co. — Bengaluru",
    address: "12th Main, Indiranagar, Bengaluru",
  },
  {
    email: "spicekitchen@zerospoil.dev",
    name: "Spice Route Catering — Delhi",
    address: "Khan Market Service Lane, New Delhi",
  },
  {
    email: "coastalkitchen@zerospoil.dev",
    name: "Malabar Leaf Events — Kochi",
    address: "MG Road Catering Hub, Ernakulam, Kochi",
  },
] as const;

async function seedUsers(passwordHash: string) {
  const donor = await prisma.user.upsert({
    where: { email: INDIAN_DONORS[0].email },
    update: { name: INDIAN_DONORS[0].name },
    create: {
      email: INDIAN_DONORS[0].email,
      name: INDIAN_DONORS[0].name,
      passwordHash,
      role: Role.DONOR,
    },
  });

  const spiceDonor = await prisma.user.upsert({
    where: { email: INDIAN_DONORS[1].email },
    update: { name: INDIAN_DONORS[1].name },
    create: {
      email: INDIAN_DONORS[1].email,
      name: INDIAN_DONORS[1].name,
      passwordHash,
      role: Role.DONOR,
    },
  });

  const coastalDonor = await prisma.user.upsert({
    where: { email: INDIAN_DONORS[2].email },
    update: { name: INDIAN_DONORS[2].name },
    create: {
      email: INDIAN_DONORS[2].email,
      name: INDIAN_DONORS[2].name,
      passwordHash,
      role: Role.DONOR,
    },
  });

  const courier = await prisma.user.upsert({
    where: { email: "courier@zerospoil.dev" },
    update: { name: "Rapid Rescue Rider — Mumbai" },
    create: {
      email: "courier@zerospoil.dev",
      name: "Rapid Rescue Rider — Mumbai",
      passwordHash,
      role: Role.COURIER,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@zerospoil.dev" },
    update: {},
    create: {
      email: "admin@zerospoil.dev",
      name: "ZeroSpoil Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  return { donor, spiceDonor, coastalDonor, courier, admin };
}

async function seedCuisinesAndDishes() {
  const cuisineIds = new Map<string, string>();

  for (const cuisine of CUISINES) {
    const row = await prisma.cuisine.upsert({
      where: { slug: cuisine.slug },
      update: {
        name: cuisine.name,
        nativeName: cuisine.nativeName,
        region: cuisine.region,
        states: cuisine.states,
        description: cuisine.description,
        flavorProfile: cuisine.flavorProfile,
      },
      create: cuisine,
    });
    cuisineIds.set(cuisine.slug, row.id);
  }

  let dishCount = 0;
  for (const dish of DISHES) {
    const cuisineId = cuisineIds.get(dish.cuisineSlug);
    if (!cuisineId) {
      throw new Error(`Missing cuisine for dish ${dish.slug}: ${dish.cuisineSlug}`);
    }

    const { cuisineSlug: _cuisineSlug, ...dishData } = dish;
    await prisma.dish.upsert({
      where: { slug: dish.slug },
      update: {
        ...dishData,
        cuisineId,
      },
      create: {
        ...dishData,
        cuisineId,
      },
    });
    dishCount += 1;
  }

  return { cuisineCount: cuisineIds.size, dishCount };
}

async function seedIndianBatches(
  donors: Awaited<ReturnType<typeof seedUsers>>,
) {
  const existing = await prisma.foodBatch.count();
  if (existing > 0) {
    return { created: 0, skipped: true };
  }

  const dishes = await prisma.dish.findMany({
    include: { cuisine: true },
    orderBy: { name: "asc" },
  });

  const sampleSlugs = [
    "hyderabadi-biryani",
    "dal-makhani",
    "masala-dosa",
    "goan-fish-curry",
    "chole-bhature",
    "veg-manchurian",
    "sambar-rice",
    "paneer-tikka",
    "dhokla",
    "chicken-lollipop",
    "misal-pav",
    "rosogolla",
  ];

  const donorRotation = [donors.donor, donors.spiceDonor, donors.coastalDonor];
  const addressRotation = INDIAN_DONORS.map((d) => d.address);

  let created = 0;
  for (const [index, slug] of sampleSlugs.entries()) {
    const dish = dishes.find((d) => d.slug === slug);
    if (!dish) continue;

    const hoursAgo = 20 + index * 8;
    const preparedAt = new Date(Date.now() - hoursAgo * 60_000);
    const donor = donorRotation[index % donorRotation.length];
    const ambient =
      dish.defaultStorage === "HOT_HOLD"
        ? 28
        : dish.defaultStorage === "REFRIGERATED"
          ? 4
          : 24;

    await prisma.foodBatch.create({
      data: {
        title: `${dish.name} surplus`,
        description: `${dish.cuisine.name} catering leftover — ${dish.description}`,
        category: dish.category,
        cuisineId: dish.cuisineId,
        dishId: dish.id,
        quantityKg: 6 + (index % 5) * 3.5,
        ambientTemperatureC: ambient,
        preparedAt,
        storageMethod: dish.defaultStorage,
        pickupAddress: addressRotation[index % addressRotation.length],
        safeWindowHours: dish.typicalSafeWindowHours,
        riskLevel: dish.perishability,
        refrigerationRequired:
          dish.defaultStorage === "REFRIGERATED" ||
          dish.defaultStorage === "FROZEN" ||
          dish.containsDairy ||
          dish.category === "PROTEIN",
        expiresAt: new Date(
          preparedAt.getTime() + dish.typicalSafeWindowHours * 3_600_000,
        ),
        status: "AVAILABLE",
        donorId: donor.id,
      },
    });
    created += 1;
  }

  return { created, skipped: false };
}

async function main() {
  const passwordHash = await hash("password123", 10);
  const users = await seedUsers(passwordHash);
  const catalog = await seedCuisinesAndDishes();
  const batches = await seedIndianBatches(users);

  console.log(
    JSON.stringify(
      {
        users: {
          donors: INDIAN_DONORS.map((d) => d.email),
          courier: "courier@zerospoil.dev",
          admin: "admin@zerospoil.dev",
        },
        catalog,
        batches,
        password: "password123",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
