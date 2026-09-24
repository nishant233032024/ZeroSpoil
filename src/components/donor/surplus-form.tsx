"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { createFoodBatchAction } from "@/app/actions/batches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ShelfLifeEvaluation } from "@/lib/types";
import type { FoodCategory, RiskLevel, StorageMethod } from "@prisma/client";
import type { CuisineOption, DishOption } from "@/components/donor/catalog-types";

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

function riskVariant(level: RiskLevel): "emerald" | "amber" | "danger" {
  if (level === "LOW") return "emerald";
  if (level === "MEDIUM") return "amber";
  return "danger";
}

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type Props = {
  cuisines: CuisineOption[];
  dishes: DishOption[];
};

export function SurplusForm({ cuisines, dishes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<ShelfLifeEvaluation | null>(
    null,
  );
  const [source, setSource] = useState<"ai" | "heuristic" | null>(null);

  const [cuisineId, setCuisineId] = useState(cuisines[0]?.id ?? "");
  const [dishId, setDishId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FoodCategory>("PREPARED_MEALS");
  const [quantityKg, setQuantityKg] = useState("10");
  const [ambientTemperatureC, setAmbientTemperatureC] = useState("28");
  const [preparedAt, setPreparedAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() - 30 * 60_000)),
  );
  const [storageMethod, setStorageMethod] =
    useState<StorageMethod>("REFRIGERATED");
  const [pickupAddress, setPickupAddress] = useState(
    "Indiranagar kitchen dock, Bengaluru",
  );

  const dishesForCuisine = useMemo(
    () => dishes.filter((dish) => dish.cuisineId === cuisineId),
    [dishes, cuisineId],
  );

  const selectedDish = dishes.find((dish) => dish.id === dishId) ?? null;

  function applyDish(nextDishId: string) {
    setDishId(nextDishId);
    setEvaluation(null);
    setSource(null);
    const dish = dishes.find((item) => item.id === nextDishId);
    if (!dish) return;

    setTitle(`${dish.name} surplus`);
    setDescription(dish.description);
    setCategory(dish.category as FoodCategory);
    setStorageMethod(dish.defaultStorage as StorageMethod);
    if (dish.defaultStorage === "HOT_HOLD") {
      setAmbientTemperatureC("28");
    } else if (dish.defaultStorage === "REFRIGERATED") {
      setAmbientTemperatureC("4");
    } else {
      setAmbientTemperatureC("24");
    }
  }

  function onCuisineChange(nextCuisineId: string) {
    setCuisineId(nextCuisineId);
    setDishId("");
    setEvaluation(null);
    setSource(null);
  }

  async function evaluateShelfLife() {
    setEvaluating(true);
    try {
      const preparedIso = new Date(preparedAt).toISOString();
      const response = await fetch("/api/ai/evaluate-shelf-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          ambientTemperatureC: Number(ambientTemperatureC),
          preparedAt: preparedIso,
          storageMethod,
          cuisineName: cuisines.find((c) => c.id === cuisineId)?.name,
          dishName: selectedDish?.name,
        }),
      });

      const json = (await response.json()) as {
        success: boolean;
        message: string;
        data?: ShelfLifeEvaluation;
        source?: "ai" | "heuristic";
      };

      if (!json.success || !json.data) {
        toast.error(json.message || "Evaluation failed.");
        return;
      }

      setEvaluation(json.data);
      setSource(json.source ?? "ai");
      toast.success(json.message);
    } catch {
      toast.error("Network error while evaluating shelf-life.");
    } finally {
      setEvaluating(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!evaluation) {
      toast.error("Run AI shelf-life evaluation before listing.");
      return;
    }

    startTransition(async () => {
      const result = await createFoodBatchAction({
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
        safeWindowHours: evaluation.safeWindowHours,
        riskLevel: evaluation.riskLevel,
        refrigerationRequired: evaluation.refrigerationRequired,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/dispatch");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cuisine">Indian cuisine / style</Label>
          <select
            id="cuisine"
            className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
            value={cuisineId}
            onChange={(e) => onCuisineChange(e.target.value)}
          >
            {cuisines.map((cuisine) => (
              <option key={cuisine.id} value={cuisine.id}>
                {cuisine.name} · {cuisine.region}
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
            onChange={(e) => applyDish(e.target.value)}
          >
            <option value="">Select a dish…</option>
            {dishesForCuisine.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name}
                {dish.hindiName ? ` (${dish.hindiName})` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedDish ? (
          <p className="md:col-span-2 text-sm text-zinc-400">
            {selectedDish.description} · typical safe window{" "}
            {selectedDish.typicalSafeWindowHours}h · {selectedDish.dietType.replaceAll("_", " ")}
          </p>
        ) : null}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Batch title</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hyderabadi biryani hotel pans"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Allergens, packaging, access instructions…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Food category</Label>
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
          <Label htmlFor="storage">Storage method</Label>
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
          <Label htmlFor="temp">Ambient temperature (°C)</Label>
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
            placeholder="Kitchen dock / loading bay"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-zinc-800 py-5">
        <Button
          type="button"
          variant="outline"
          onClick={evaluateShelfLife}
          disabled={evaluating}
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          {evaluating ? "Evaluating…" : "Evaluate shelf-life"}
        </Button>

        {evaluation ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
            <Badge variant={riskVariant(evaluation.riskLevel)}>
              {evaluation.riskLevel} risk
            </Badge>
            <span>
              Safe window:{" "}
              <strong className="text-white">
                {evaluation.safeWindowHours}h
              </strong>
            </span>
            <span>
              Refrigeration:{" "}
              {evaluation.refrigerationRequired ? "Required" : "Not required"}
            </span>
            {source ? (
              <Badge variant="default">{source.toUpperCase()}</Badge>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Run evaluation to unlock listing.
          </p>
        )}
      </div>

      {evaluation ? (
        <p className="text-sm text-zinc-400">{evaluation.rationale}</p>
      ) : null}

      <Button type="submit" disabled={pending || !evaluation} size="lg">
        {pending ? "Listing…" : "List surplus batch"}
      </Button>
    </form>
  );
}
