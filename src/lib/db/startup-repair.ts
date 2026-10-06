import { ONBOARDING_TOTAL_STEPS } from "@/features/onboarding/constants";
import { prisma } from "@/lib/db/prisma";

let repairedLegacySteps = false;

/**
 * Clamp legacy onboarding currentStep values that exceed the active step total.
 * Runs once per process against PostgreSQL (source of truth for Employee).
 */
export async function repairLegacyOnboardingSteps(): Promise<void> {
  if (repairedLegacySteps) return;
  repairedLegacySteps = true;
  try {
    await prisma.employee.updateMany({
      where: {
        currentStep: { gt: ONBOARDING_TOTAL_STEPS },
      },
      data: {
        currentStep: ONBOARDING_TOTAL_STEPS,
      },
    });
  } catch {
    repairedLegacySteps = false;
  }
}

/**
 * Lightweight PostgreSQL connectivity check for health endpoints.
 * Does not expose connection strings or credentials.
 */
export async function pingPostgres(): Promise<{
  ok: boolean;
  database?: string;
  error?: string;
}> {
  try {
    const rows = await prisma.$queryRaw<Array<{ db: string }>>`
      SELECT current_database() AS db
    `;
    return {
      ok: true,
      database: rows[0]?.db ?? "postgresql",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
