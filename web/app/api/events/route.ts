import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, appendFileSync } from "fs";
import { join } from "path";

// Analytics ingestion — the funnel events Ruth demanded become real data here.
// Events land in a JSONL file (one JSON object per line) under DATA_DIR (or .data/).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = Array.isArray(body?.events) ? body.events : [body];
    const clean = events
      .filter((e: unknown) => e && typeof e === "object" && typeof (e as { t?: unknown }).t === "string")
      .slice(0, 100)
      .map((e: Record<string, unknown>) => JSON.stringify({
        t: String(e.t).slice(0, 64),
        d: String(e.d ?? "").slice(0, 200),
        at: typeof e.at === "string" ? e.at.slice(0, 32) : new Date().toISOString(),
        ua: (req.headers.get("user-agent") || "").slice(0, 120),
        ref: (req.headers.get("referer") || "").slice(0, 200),
      }));
    if (!clean.length) return NextResponse.json({ ok: false, error: "no valid events" }, { status: 400 });
    const dir = process.env.DATA_DIR || join(process.cwd(), ".data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "events.jsonl"), clean.join("\n") + "\n", "utf8");
    return NextResponse.json({ ok: true, stored: clean.length });
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
}
