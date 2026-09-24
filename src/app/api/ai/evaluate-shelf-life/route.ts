import { generateText, Output } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import {
  shelfLifeInputSchema,
  shelfLifeOutputSchema,
} from "@/lib/validations";
import { computeHeuristicShelfLife } from "@/lib/shelf-life";
import { enforceAiRateLimit } from "@/lib/ai-rate-limit";
import type { ShelfLifeEvaluation } from "@/lib/types";

export const runtime = "nodejs";

function getModel() {
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return groq("llama-3.3-70b-versatile");
  }
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai("gpt-4o-mini");
  }
  return null;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const limit = enforceAiRateLimit(clientIp(request));
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        message: `Rate limit exceeded. Retry in ${limit.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = shelfLifeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
      { status: 400 },
    );
  }

  const preparedAt = new Date(parsed.data.preparedAt);
  if (Number.isNaN(preparedAt.getTime())) {
    return NextResponse.json(
      { success: false, message: "Invalid preparation timestamp." },
      { status: 400 },
    );
  }

  const model = getModel();

  if (!model) {
    const heuristic = computeHeuristicShelfLife({
      category: parsed.data.category,
      ambientTemperatureC: parsed.data.ambientTemperatureC,
      preparedAt,
      storageMethod: parsed.data.storageMethod,
    });

    return NextResponse.json({
      success: true,
      message: "Evaluated via safety heuristic (no AI key configured).",
      data: heuristic,
      source: "heuristic" as const,
    });
  }

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: shelfLifeOutputSchema }),
      system: `You are a food-safety shelf-life engine for perishable surplus recovery.
Return conservative, actionable estimates suitable for shelters.
Prefer shorter safe windows when temperature abuse or protein/dairy risk is present.
Never invent unsafe long windows for hot-held or ambient prepared meals.`,
      prompt: `Evaluate safe remaining shelf-life for this surplus batch:
- Indian cuisine / style: ${parsed.data.cuisineName ?? "unspecified"}
- Dish: ${parsed.data.dishName ?? "unspecified"}
- Category: ${parsed.data.category}
- Ambient temperature (°C): ${parsed.data.ambientTemperatureC}
- Preparation time (ISO): ${preparedAt.toISOString()}
- Storage method: ${parsed.data.storageMethod}
- Current time (ISO): ${new Date().toISOString()}

Account for Indian catering realities (biryani rice + meat, dairy gravies, coconut-milk seafood, hot-held chaat). Respond with safeWindowHours (remaining hours from now), riskLevel (LOW|MEDIUM|HIGH), refrigerationRequired, and a brief rationale.`,
    });

    const data: ShelfLifeEvaluation = {
      safeWindowHours: output.safeWindowHours,
      riskLevel: output.riskLevel,
      refrigerationRequired: output.refrigerationRequired,
      rationale: output.rationale,
    };

    return NextResponse.json({
      success: true,
      message: "AI shelf-life evaluation complete.",
      data,
      source: "ai" as const,
    });
  } catch {
    const heuristic = computeHeuristicShelfLife({
      category: parsed.data.category,
      ambientTemperatureC: parsed.data.ambientTemperatureC,
      preparedAt,
      storageMethod: parsed.data.storageMethod,
    });

    return NextResponse.json({
      success: true,
      message: "AI unavailable — fell back to safety heuristic.",
      data: heuristic,
      source: "heuristic" as const,
    });
  }
}
