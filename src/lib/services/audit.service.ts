import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { Prisma } from "@/generated/prisma/client";
import { toClientProps } from "@/lib/serialize/client-props";

function asInputJson(
  value: Record<string, unknown> | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}

export async function logAudit(params: {
  action: string;
  entity: string;
  entityId?: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  // Optional User FK — keep name/role even if the user row is missing
  const performer = await prisma.user.findUnique({
    where: { id: params.performedBy },
    select: { id: true },
  });

  await prisma.auditLog.create({
    data: {
      id: newObjectIdString(),
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      performedBy: performer?.id ?? null,
      performedByName: params.performedByName,
      performedByRole: params.performedByRole,
      details: asInputJson(params.details),
      ipAddress: params.ipAddress ?? null,
      createdAt: new Date(),
    },
  });
}

export interface AuditLogItem {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  performedByName: string;
  performedByRole: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export async function getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      performedByName: true,
      performedByRole: true,
      details: true,
      createdAt: true,
    },
  });

  return logs.map((l) =>
    toClientProps({
      _id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId ?? undefined,
      performedByName: l.performedByName,
      performedByRole: l.performedByRole,
      details: (l.details as Record<string, unknown> | null) ?? undefined,
      createdAt: l.createdAt.toISOString(),
    })
  );
}
