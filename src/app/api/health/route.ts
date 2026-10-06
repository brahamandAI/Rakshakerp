import { NextResponse } from "next/server";
import { pingPostgres } from "@/lib/db/startup-repair";
import { getRequiredEnvChecks } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getRequiredEnvChecks();
  const db = await pingPostgres();

  const status =
    db.ok && env.filter((e) => e.required).every((e) => e.configured)
      ? 200
      : 503;

  return NextResponse.json(
    {
      status: status === 200 ? "ok" : "degraded",
      database: db,
      environment: env,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
