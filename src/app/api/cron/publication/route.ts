import { NextRequest, NextResponse } from "next/server";
import { runPublicationWorker, schedulePublicationMaintenance } from "@/lib/publication/scheduler";

export const maxDuration = 60;

function allowed(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && request.headers.get("authorization") === `Bearer ${expected}`);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (!allowed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schedule = await schedulePublicationMaintenance().catch(error => ({
    status: "schedule-failed",
    error: error instanceof Error ? error.message : String(error)
  }));
  const worker = await runPublicationWorker(8,35_000).catch(error => ({
    status: "worker-failed",
    processed: 0,
    failed: 1,
    error: error instanceof Error ? error.message : String(error)
  }));
  return NextResponse.json({ ok: true, schedule, worker });
}
