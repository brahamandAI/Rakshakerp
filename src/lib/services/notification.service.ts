import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { UserRole } from "@/types/enums";
import {
  NotificationType,
  NotificationViewModel,
  NotificationRecipientType,
} from "@/features/notifications/constants";

export interface CreateNotificationParams {
  recipientType: NotificationRecipientType;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  employeeId?: string;
  applicationRef?: string;
  linkUrl?: string;
}

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  linkUrl: string | null;
  applicationRef: string | null;
  employeeId: string | null;
};

function mapNotification(doc: NotificationRow): NotificationViewModel {
  return {
    _id: doc.id,
    type: doc.type as NotificationType,
    title: doc.title,
    body: doc.body,
    readAt: doc.readAt ? doc.readAt.toISOString() : undefined,
    createdAt: doc.createdAt.toISOString(),
    linkUrl: doc.linkUrl ?? undefined,
    applicationRef: doc.applicationRef ?? undefined,
    employeeId: doc.employeeId ?? undefined,
  };
}

const listSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  readAt: true,
  createdAt: true,
  linkUrl: true,
  applicationRef: true,
  employeeId: true,
} as const;

/**
 * Staff notifications: recipientId is a User id (FK).
 * Employee notifications: recipientId cannot be an Employee id (User FK),
 * so the employee id is stored in recipientLegacyId (+ employeeId), matching
 * the Mongo→PG migration layout.
 */
function staffRecipientWhere(userId: string) {
  return {
    OR: [
      {
        recipientId: userId,
        recipientType: { in: ["STAFF", ""] },
      },
      {
        recipientLegacyId: userId,
        recipientType: { in: ["STAFF", ""] },
      },
    ],
  };
}

function employeeRecipientWhere(employeeId: string) {
  return {
    recipientType: "EMPLOYEE",
    OR: [
      { recipientLegacyId: employeeId },
      { employeeId },
    ],
  };
}

function recipientWhere(
  recipientType: NotificationRecipientType,
  recipientId: string
) {
  if (recipientType === "STAFF") {
    return {
      recipientType: "STAFF",
      OR: [{ recipientId }, { recipientLegacyId: recipientId }],
    };
  }
  return employeeRecipientWhere(recipientId);
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  const now = new Date();
  const isEmployeeRecipient = params.recipientType === "EMPLOYEE";
  const linkedEmployeeId = params.employeeId ?? (isEmployeeRecipient ? params.recipientId : undefined);

  await prisma.notification.create({
    data: {
      id: newObjectIdString(),
      recipientType: params.recipientType,
      // User FK: only set recipientId for STAFF users that exist in `users`
      recipientId: isEmployeeRecipient ? null : params.recipientId,
      recipientLegacyId: isEmployeeRecipient ? params.recipientId : null,
      type: params.type,
      title: params.title,
      body: params.body,
      employeeId: linkedEmployeeId ?? null,
      applicationRef: params.applicationRef ?? null,
      linkUrl: params.linkUrl ?? null,
      createdAt: now,
    },
  });
}

export async function notifyStaffByRole(
  role: UserRole.L1 | UserRole.L2 | UserRole.SUPPORT,
  params: Omit<CreateNotificationParams, "recipientType" | "recipientId"> & {
    recipientId?: string;
  }
): Promise<void> {
  if (params.recipientId) {
    await createNotification({
      ...params,
      recipientType: "STAFF",
      recipientId: params.recipientId,
    });
    return;
  }

  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });

  for (const user of users) {
    await createNotification({
      ...params,
      recipientType: "STAFF",
      recipientId: user.id,
    });
  }
}

export async function getNotificationHistory(
  recipientType: NotificationRecipientType,
  recipientId: string,
  limit = 50
): Promise<NotificationViewModel[]> {
  const items = await prisma.notification.findMany({
    where: recipientWhere(recipientType, recipientId),
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map(mapNotification);
}

/** @deprecated Use getNotificationHistory */
export async function getNotificationsForUser(userId: string, limit = 20) {
  const items = await prisma.notification.findMany({
    where: staffRecipientWhere(userId),
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return items.map((n) => ({
    ...n,
    _id: n.id,
  }));
}

export async function getUnreadCount(
  recipientType: NotificationRecipientType,
  recipientId: string
): Promise<number> {
  return prisma.notification.count({
    where: {
      ...recipientWhere(recipientType, recipientId),
      readAt: null,
    },
  });
}

/** Staff unread — includes legacy notifications without recipientType */
export async function getStaffUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      readAt: null,
      ...staffRecipientWhere(userId),
    },
  });
}

export async function markNotificationRead(
  notificationId: string,
  recipientType: NotificationRecipientType,
  recipientId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      ...recipientWhere(recipientType, recipientId),
    },
    data: { readAt: new Date() },
  });
}

export async function markStaffNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      readAt: null,
      ...staffRecipientWhere(userId),
    },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(
  recipientType: NotificationRecipientType,
  recipientId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      ...recipientWhere(recipientType, recipientId),
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function markAllStaffNotificationsRead(
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      readAt: null,
      ...staffRecipientWhere(userId),
    },
    data: { readAt: new Date() },
  });
}

export async function getStaffNotificationHistory(
  userId: string,
  limit = 50
): Promise<NotificationViewModel[]> {
  const items = await prisma.notification.findMany({
    where: staffRecipientWhere(userId),
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return items.map(mapNotification);
}

export async function getEmployeeNotificationHistory(
  employeeId: string,
  limit = 50
): Promise<NotificationViewModel[]> {
  return getNotificationHistory("EMPLOYEE", employeeId, limit);
}

export async function getEmployeeUnreadCount(
  employeeId: string
): Promise<number> {
  return getUnreadCount("EMPLOYEE", employeeId);
}
