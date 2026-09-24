"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateFoodBatchAction } from "@/app/actions/batches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CuisineOption, DishOption } from "@/components/donor/catalog-types";
import type { FoodCategory, RiskLevel, StorageMethod } from "@prisma/client";

const CATEGORIES: FoodCategory[] = [
  "PREPARED_MEALS",
  "DAIRY",
  "PRODUCE",
  "BAKERY",
  "PROTEIN",
  "OTHER",
];

const STORAGE: StorageMethod[] = [
  "AMBIENT",
  "REFRIGERATED",
  "FROZEN",
  "HOT_HOLD",
];

const RISKS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH"];

function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type EditableBatch = {
  id: string;
  title: string;
  description: string | null;
  category: FoodCategory;
  cuisineId: string | null;
  dishId: string | null;
  quantityKg: number;
  ambientTemperatureC: number;
  preparedAt: string;
  storageMethod: StorageMethod;
  pickupAddress: string;
  safeWindowHours: number;
  riskLevel: RiskLevel;
  refrigerationRequired: boolean;
};

type Props = {
  batch: EditableBatch;
  cuisines: CuisineOption[];
  dishes: DishOption[];
};

export function EditBatchForm({ batch, cuisines, dishes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [cuisineId, setCuisineId] = useState(batch.cuisineId ?? cuisines[0]?.id ?? "");
  const [dishId, setDishId] = useState(batch.dishId ?? "");
  const [title, setTitle] = useState(batch.title);
  const [description, setDescription] = useState(batch.description ?? "");
  const [category, setCategory] = useState<FoodCategory>(batch.category);
  const [quantityKg, setQuantityKg] = useState(String(batch.quantityKg));
  const [ambientTemperatureC, setAmbientTemperatureC] = useState(
    String(batch.ambientTemperatureC),
  );
  const [preparedAt, setPreparedAt] = useState(
    toLocalInputValue(batch.preparedAt),
  );
  const [storageMethod, setStorageMethod] = useState<StorageMethod>(
    batch.storageMethod,
  );
  const [pickupAddress, setPickupAddress] = useState(batch.pickupAddress);
  const [safeWindowHours, setSafeWindowHours] = useState(
    String(batch.safeWindowHours),
  );
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(batch.riskLevel);
  const [refrigerationRequired, setRefrigerationRequired] = useState(
    batch.refrigerationRequired,
  );

  const dishesForCuisine = useMemo(
    () => dishes.filter((dish) => dish.cuisineId === cuisineId),
    [dishes, cuisineId],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateFoodBatchAction({
        id: batch.id,
        title,
        description: description || undefined,
        category,
        cuisineId: cuisineId || undefined,
        dishId: dishId || undefined,
        quantityKg: Number(quantityKg),
        ambientTemperatureC: Number(ambientTemperatureC),
        preparedAt: new Date(preparedAt).toISOString(),
        storageMethod,
        pickupAddress,
        safeWindowHours: Number(safeWindowHours),
        riskLevel,
        refrigerationRequired,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/donor/batches");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <select
            id="cuisine"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={cuisineId}
            onChange={(e) => {
              setCuisineId(e.target.value);
              setDishId("");
            }}
          >
            {cuisines.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dish">Dish</Label>
          <select
            id="dish"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={dishId}
            onChange={(e) => setDishId(e.target.value)}
          >
            <option value="">—</option>
            {dishesForCuisine.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory)}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">Storage</Label>
          <select
            id="storage"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={storageMethod}
            onChange={(e) => setStorageMethod(e.target.value as StorageMethod)}
          >
            {STORAGE.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="qty">Quantity (kg)</Label>
          <Input
            id="qty"
            type="number"
            min={0.1}
            step={0.1}
            required
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="temp">Ambient °C</Label>
          <Input
            id="temp"
            type="number"
            step={0.1}
            required
            value={ambientTemperatureC}
            onChange={(e) => setAmbientTemperatureC(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prepared">Prepared at</Label>
          <Input
            id="prepared"
            type="datetime-local"
            required
            value={preparedAt}
            onChange={(e) => setPreparedAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Pickup address</Label>
          <Input
            id="address"
            required
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="window">Safe window (hours)</Label>
          <Input
            id="window"
            type="number"
            min={0.5}
            step={0.1}
            required
            value={safeWindowHours}
            onChange={(e) => setSafeWindowHours(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="risk">Risk level</Label>
          <select
            id="risk"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
          >
            {RISKS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            id="fridge"
            type="checkbox"
            checked={refrigerationRequired}
            onChange={(e) => setRefrigerationRequired(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600"
          />
          <Label htmlFor="fridge">Refrigeration required</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/donor/batches")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
