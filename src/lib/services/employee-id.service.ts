import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { newObjectIdString } from "@/lib/db/ids";
import { EmployeeStatus } from "@/types/enums";

export const TEMP_EMPLOYEE_ID_COUNTER_KEY = "employee_id_counter_rspl_temp";

export class EmployeeIdError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "EmployeeIdError";
  }
}

export function formatTemporaryEmployeeId(sequence: number): string {
  return `RSPL ${String(sequence).padStart(5, "0")}`;
}

type CounterValue = { sequence: number; prefix: string };

function parseCounterValue(value: unknown): CounterValue {
  const rec =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    sequence: Number(rec.sequence ?? 0) || 0,
    prefix: typeof rec.prefix === "string" ? rec.prefix : "RSPL",
  };
}

/**
 * Generates a unique Temporary Employee ID after L2 approval.
 * Format: RSPL 00001, RSPL 00002, ...
 *
 * Counter increment + employee assignment run in one PostgreSQL transaction
 * so concurrent L2 approvals cannot reuse the same sequence.
 */
export async function generateTemporaryEmployeeId(
  employeeId: string
): Promise<{ employeeIdCode: string }> {
  return prisma.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new EmployeeIdError("Employee not found", "NOT_FOUND");
    }

    if (employee.temporaryEmployeeId) {
      return { employeeIdCode: employee.temporaryEmployeeId };
    }

    const allowedStatuses = [
      EmployeeStatus.APPROVED,
      EmployeeStatus.L2_REVIEW,
      EmployeeStatus.ID_GENERATED,
      EmployeeStatus.ID_CARD_ISSUED,
    ];

    if (!allowedStatuses.includes(employee.status as EmployeeStatus)) {
      throw new EmployeeIdError(
        "Temporary Employee ID can only be generated after L2 approval",
        "INVALID_STATUS"
      );
    }

    let setting = await tx.setting.findUnique({
      where: { key: TEMP_EMPLOYEE_ID_COUNTER_KEY },
    });

    const now = new Date();
    if (!setting) {
      setting = await tx.setting.create({
        data: {
          id: newObjectIdString(),
          key: TEMP_EMPLOYEE_ID_COUNTER_KEY,
          value: { sequence: 0, prefix: "RSPL" },
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    // Lock the counter row for the duration of this transaction
    await tx.$queryRaw`
      SELECT id FROM settings WHERE key = ${TEMP_EMPLOYEE_ID_COUNTER_KEY} FOR UPDATE
    `;

    const locked = await tx.setting.findUnique({
      where: { key: TEMP_EMPLOYEE_ID_COUNTER_KEY },
    });
    if (!locked) {
      throw new EmployeeIdError(
        "Failed to allocate temporary employee number",
        "COUNTER_ERROR"
      );
    }

    const current = parseCounterValue(locked.value);
    const sequence = current.sequence + 1;
    if (!Number.isFinite(sequence) || sequence < 1) {
      throw new EmployeeIdError(
        "Failed to allocate temporary employee number",
        "COUNTER_ERROR"
      );
    }

    await tx.setting.update({
      where: { key: TEMP_EMPLOYEE_ID_COUNTER_KEY },
      data: {
        value: {
          sequence,
          prefix: current.prefix,
        } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    const employeeIdCode = formatTemporaryEmployeeId(sequence);

    const duplicate = await tx.employee.findFirst({
      where: {
        OR: [
          { temporaryEmployeeId: employeeIdCode },
          { employeeId: employeeIdCode },
        ],
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new EmployeeIdError("Duplicate employee ID generated", "DUPLICATE");
    }

    const nextStatus =
      employee.status === EmployeeStatus.APPROVED
        ? EmployeeStatus.ID_GENERATED
        : employee.status;

    await tx.employee.update({
      where: { id: employeeId },
      data: {
        temporaryEmployeeId: employeeIdCode,
        employeeId: employeeIdCode,
        idGeneratedAt: new Date(),
        status: nextStatus,
        updatedAt: new Date(),
      },
    });

    return { employeeIdCode };
  });
}
