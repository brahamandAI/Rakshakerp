import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { Prisma } from "@/generated/prisma/client";
import { StaffRole, UserRole } from "@/types/enums";
import { hashPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/services/audit.service";
import { SITE } from "@/features/marketing/constants";
import { toClientProps } from "@/lib/serialize/client-props";

export class AdminError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export interface CompanyDetails {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  gstin?: string;
  pan?: string;
  founded?: string;
}

export interface AppSettings {
  maintenanceMode: boolean;
  otpExpiryMinutes: number;
  maxLoginAttempts: number;
  sessionTimeoutHours: number;
  allowEmployeeRegistration: boolean;
}

const COMPANY_KEY = "company_details";
const APP_SETTINGS_KEY = "app_settings";

const DEFAULT_COMPANY: CompanyDetails = {
  name: SITE.legalName,
  tagline: SITE.tagline,
  email: SITE.email,
  phone: SITE.phone,
  address: SITE.address,
  website: SITE.url,
  founded: SITE.founded.startsWith("[") ? undefined : SITE.founded,
};

const DEFAULT_SETTINGS: AppSettings = {
  maintenanceMode: false,
  otpExpiryMinutes: 10,
  maxLoginAttempts: 5,
  sessionTimeoutHours: 8,
  allowEmployeeRegistration: true,
};

interface AdminContext {
  userId: string;
  userName: string;
  userRole: string;
}

type WithMongoId<T extends { id: string }> = T & { _id: string };

function withMongoId<T extends { id: string }>(row: T): WithMongoId<T> {
  return { ...row, _id: row.id };
}

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function audit(
  ctx: AdminContext,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  await logAudit({
    action,
    entity,
    entityId,
    performedBy: ctx.userId,
    performedByName: ctx.userName,
    performedByRole: ctx.userRole,
    details,
  });
}

async function upsertSetting(key: string, value: unknown): Promise<void> {
  const now = new Date();
  await prisma.setting.upsert({
    where: { key },
    create: {
      id: newObjectIdString(),
      key,
      value: asInputJson(value),
      createdAt: now,
      updatedAt: now,
    },
    update: {
      value: asInputJson(value),
      updatedAt: now,
    },
  });
}

export async function getCompanyDetails(): Promise<CompanyDetails> {
  const doc = await prisma.setting.findUnique({ where: { key: COMPANY_KEY } });
  if (!doc) return DEFAULT_COMPANY;
  return toClientProps({
    ...DEFAULT_COMPANY,
    ...(doc.value as unknown as CompanyDetails),
  });
}

export async function updateCompanyDetails(
  ctx: AdminContext,
  data: CompanyDetails
): Promise<void> {
  await upsertSetting(COMPANY_KEY, data);
  await audit(ctx, "UPDATE", "COMPANY", COMPANY_KEY, { name: data.name });
}

export async function getAppSettings(): Promise<AppSettings> {
  const doc = await prisma.setting.findUnique({
    where: { key: APP_SETTINGS_KEY },
  });
  if (!doc) return DEFAULT_SETTINGS;
  return toClientProps({
    ...DEFAULT_SETTINGS,
    ...(doc.value as unknown as AppSettings),
  });
}

export async function updateAppSettings(
  ctx: AdminContext,
  data: AppSettings
): Promise<void> {
  await upsertSetting(APP_SETTINGS_KEY, data);
  await audit(
    ctx,
    "UPDATE",
    "SETTINGS",
    APP_SETTINGS_KEY,
    data as unknown as Record<string, unknown>
  );
}

export async function listDepartments() {
  const rows = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map(withMongoId);
}

export async function createDepartment(
  ctx: AdminContext,
  data: { name: string; code: string; description?: string }
) {
  const code = data.code.toUpperCase();
  const existing = await prisma.department.findFirst({ where: { code } });
  if (existing) throw new AdminError("Department code already exists", "DUPLICATE");

  const now = new Date();
  const dept = await prisma.department.create({
    data: {
      id: newObjectIdString(),
      name: data.name,
      code,
      description: data.description ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await audit(ctx, "CREATE", "DEPARTMENT", dept.id, { name: data.name });
  return withMongoId(dept);
}

export async function updateDepartment(
  ctx: AdminContext,
  id: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>
) {
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) throw new AdminError("Department not found", "NOT_FOUND");

  const dept = await prisma.department.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    },
  });

  await audit(ctx, "UPDATE", "DEPARTMENT", id, data as Record<string, unknown>);
  return withMongoId(dept);
}

export async function listDesignations() {
  const rows = await prisma.designation.findMany({
    include: {
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => {
    const { department, ...rest } = row;
    return {
      ...withMongoId(rest),
      departmentId: department
        ? { _id: department.id, name: department.name }
        : null,
    };
  });
}

export async function createDesignation(
  ctx: AdminContext,
  data: {
    name: string;
    code: string;
    departmentId?: string;
    level?: number;
  }
) {
  const code = data.code.toUpperCase();
  if (!data.departmentId) {
    throw new AdminError("Department is required", "VALIDATION");
  }

  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
    select: { id: true },
  });
  if (!department) {
    throw new AdminError("Department not found", "NOT_FOUND");
  }

  const existing = await prisma.designation.findFirst({ where: { code } });
  if (existing) {
    throw new AdminError("Designation code already exists", "DUPLICATE");
  }

  const now = new Date();
  const des = await prisma.designation.create({
    data: {
      id: newObjectIdString(),
      name: data.name,
      code,
      departmentId: department.id,
      level: data.level ?? 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await audit(ctx, "CREATE", "DESIGNATION", des.id, { name: data.name });
  return withMongoId(des);
}

export async function updateDesignation(
  ctx: AdminContext,
  id: string,
  data: Partial<{ name: string; level: number; isActive: boolean }>
) {
  const existing = await prisma.designation.findUnique({ where: { id } });
  if (!existing) throw new AdminError("Designation not found", "NOT_FOUND");

  const des = await prisma.designation.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    },
  });

  await audit(ctx, "UPDATE", "DESIGNATION", id, data as Record<string, unknown>);
  return withMongoId(des);
}

export async function listSiteLocations() {
  const rows = await prisma.siteLocation.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map(withMongoId);
}

export async function createSiteLocation(
  ctx: AdminContext,
  data: {
    name: string;
    code: string;
    address?: string;
    city: string;
    state: string;
    pincode?: string;
    contactPerson?: string;
    contactPhone?: string;
  }
) {
  const code = data.code.toUpperCase();
  const existing = await prisma.siteLocation.findFirst({ where: { code } });
  if (existing) throw new AdminError("Site code already exists", "DUPLICATE");

  const now = new Date();
  const site = await prisma.siteLocation.create({
    data: {
      id: newObjectIdString(),
      name: data.name,
      code,
      address: data.address ?? null,
      city: data.city,
      state: data.state,
      pincode: data.pincode ?? null,
      contactPerson: data.contactPerson ?? null,
      contactPhone: data.contactPhone ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await audit(ctx, "CREATE", "SITE_LOCATION", site.id, { name: data.name });
  return withMongoId(site);
}

export async function updateSiteLocation(
  ctx: AdminContext,
  id: string,
  data: Partial<{
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactPerson: string;
    contactPhone: string;
    isActive: boolean;
  }>
) {
  const existing = await prisma.siteLocation.findUnique({ where: { id } });
  if (!existing) throw new AdminError("Site location not found", "NOT_FOUND");

  const site = await prisma.siteLocation.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.state !== undefined ? { state: data.state } : {}),
      ...(data.pincode !== undefined ? { pincode: data.pincode } : {}),
      ...(data.contactPerson !== undefined
        ? { contactPerson: data.contactPerson }
        : {}),
      ...(data.contactPhone !== undefined
        ? { contactPhone: data.contactPhone }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    },
  });

  await audit(ctx, "UPDATE", "SITE_LOCATION", id, data as Record<string, unknown>);
  return withMongoId(site);
}

const MANAGEABLE_ROLES: StaffRole[] = [
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.SCANNING,
  UserRole.ADMIN,
  UserRole.PAYROLL_MANAGER,
  UserRole.PAYROLL_EXECUTIVE,
];

const staffUserPublicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  department: true,
  phone: true,
  isActive: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  passwordChangedAt: true,
  createdBy: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  assignedPayrollManagerId: true,
  assignedPayrollManager: {
    select: { id: true, name: true },
  },
} as const;

async function resolvePayrollExecutiveManager(
  assignedPayrollManagerId: string | null | undefined,
  executiveId?: string
): Promise<string> {
  const managerId = assignedPayrollManagerId?.trim();
  if (!managerId) {
    throw new AdminError(
      "Select the Payroll Manager this executive is assigned to",
      "VALIDATION"
    );
  }
  if (executiveId && managerId === executiveId) {
    throw new AdminError(
      "A Payroll Executive cannot be assigned to themselves",
      "VALIDATION"
    );
  }

  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, role: true, isActive: true },
  });
  if (
    !manager ||
    manager.role !== UserRole.PAYROLL_MANAGER ||
    !manager.isActive
  ) {
    throw new AdminError("Assigned Payroll Manager is not available", "VALIDATION");
  }
  return manager.id;
}

async function assertPayrollUserRemovable(user: {
  id: string;
  role: string;
}) {
  if (user.role === UserRole.PAYROLL_MANAGER) {
    const executives = await prisma.user.count({
      where: { assignedPayrollManagerId: user.id },
    });
    if (executives > 0) {
      throw new AdminError(
        "Reassign this Payroll Manager's executives before deleting the account",
        "FORBIDDEN"
      );
    }
  }

  const attendance = await prisma.attendance.count({
    where: {
      OR: [
        { uploadedById: user.id },
        { payrollManagerId: user.id },
        { payrollExecutiveId: user.id },
      ],
    },
  });
  if (attendance > 0) {
    throw new AdminError(
      "This user is part of attendance records and cannot be deleted",
      "FORBIDDEN"
    );
  }
}

export async function listStaffUsers() {
  const rows = await prisma.user.findMany({
    where: { role: { in: MANAGEABLE_ROLES } },
    orderBy: { createdAt: "desc" },
    select: staffUserPublicSelect,
  });
  return rows.map(withMongoId);
}

export async function createStaffUser(
  ctx: AdminContext,
  data: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    department?: string;
    phone?: string;
    assignedPayrollManagerId?: string;
  }
) {
  if (!MANAGEABLE_ROLES.includes(data.role)) {
    throw new AdminError("Invalid role for staff user creation", "FORBIDDEN");
  }

  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AdminError("Email already registered", "DUPLICATE");

  const creator = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { id: true },
  });

  const assignedPayrollManagerId =
    data.role === UserRole.PAYROLL_EXECUTIVE
      ? await resolvePayrollExecutiveManager(data.assignedPayrollManagerId)
      : null;

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: newObjectIdString(),
      name: data.name,
      email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      department: data.department ?? null,
      phone: data.phone ?? null,
      isActive: true,
      createdBy: creator?.id ?? null,
      assignedPayrollManagerId,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    },
    select: staffUserPublicSelect,
  });

  await audit(ctx, "CREATE", "USER", user.id, {
    email: data.email,
    role: data.role,
    ...(assignedPayrollManagerId
      ? { assignedPayrollManagerId }
      : {}),
  });
  return withMongoId(user);
}

export async function updateStaffUser(
  ctx: AdminContext,
  id: string,
  data: Partial<{
    name: string;
    role: StaffRole;
    department: string;
    phone: string;
    isActive: boolean;
    password: string;
    assignedPayrollManagerId: string | null;
  }>
) {
  if (id === ctx.userId && data.isActive === false) {
    throw new AdminError("Cannot deactivate your own account", "FORBIDDEN");
  }

  const userToUpdate = await prisma.user.findUnique({ where: { id } });
  if (!userToUpdate) throw new AdminError("User not found", "NOT_FOUND");
  if (!MANAGEABLE_ROLES.includes(userToUpdate.role as StaffRole)) {
    throw new AdminError("This user cannot be modified here", "FORBIDDEN");
  }

  if (data.role && !MANAGEABLE_ROLES.includes(data.role)) {
    throw new AdminError("Invalid role", "FORBIDDEN");
  }

  if (id === ctx.userId && data.role && data.role !== userToUpdate.role) {
    throw new AdminError("You cannot change your own role", "FORBIDDEN");
  }

  if (
    userToUpdate.role === UserRole.ADMIN &&
    data.role &&
    data.role !== UserRole.ADMIN
  ) {
    const otherAdmins = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        id: { not: userToUpdate.id },
        isActive: true,
      },
    });
    if (otherAdmins === 0) {
      throw new AdminError(
        "Cannot change the role of the last active admin",
        "FORBIDDEN"
      );
    }
  }

  const nextRole = data.role ?? userToUpdate.role;
  if (
    userToUpdate.role === UserRole.PAYROLL_MANAGER &&
    nextRole !== UserRole.PAYROLL_MANAGER
  ) {
    const executives = await prisma.user.count({
      where: { assignedPayrollManagerId: userToUpdate.id },
    });
    if (executives > 0) {
      throw new AdminError(
        "Reassign this Payroll Manager's executives before changing the role",
        "FORBIDDEN"
      );
    }
  }

  const updateData: Prisma.UserUpdateInput = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const assignmentTouched =
    data.role !== undefined || data.assignedPayrollManagerId !== undefined;

  if (nextRole === UserRole.PAYROLL_EXECUTIVE && assignmentTouched) {
    const managerId = await resolvePayrollExecutiveManager(
      data.assignedPayrollManagerId !== undefined
        ? data.assignedPayrollManagerId
        : userToUpdate.assignedPayrollManagerId,
      userToUpdate.id
    );
    updateData.assignedPayrollManager = { connect: { id: managerId } };
  } else if (
    data.role !== undefined &&
    data.role !== UserRole.PAYROLL_EXECUTIVE &&
    userToUpdate.assignedPayrollManagerId
  ) {
    updateData.assignedPayrollManager = { disconnect: true };
  }
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    updateData.passwordChangedAt = new Date();
    updateData.resetPasswordToken = null;
    updateData.resetPasswordExpires = null;
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const user = await prisma.user.findUnique({
    where: { id },
    select: staffUserPublicSelect,
  });
  if (!user) throw new AdminError("User not found", "NOT_FOUND");

  const auditData = { ...data } as Record<string, unknown>;
  if ("password" in auditData) {
    auditData.password = "[REDACTED]";
  }
  await audit(ctx, "UPDATE", "USER", id, auditData);
  return withMongoId(user);
}

export async function deleteStaffUser(
  ctx: AdminContext,
  id: string
): Promise<void> {
  if (id === ctx.userId) {
    throw new AdminError("Cannot delete your own account", "FORBIDDEN");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AdminError("User not found", "NOT_FOUND");
  if (!MANAGEABLE_ROLES.includes(user.role as StaffRole)) {
    throw new AdminError("This user cannot be deleted here", "FORBIDDEN");
  }

  await assertPayrollUserRemovable(user);

  if (user.role === UserRole.ADMIN) {
    const otherAdmins = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        id: { not: user.id },
        isActive: true,
      },
    });
    if (otherAdmins === 0) {
      throw new AdminError("Cannot delete the last active admin", "FORBIDDEN");
    }
  }

  await prisma.employee.updateMany({
    where: { submittedBy: user.id },
    data: {
      submittedByName: user.name,
      submittedByEmail: user.email,
      updatedAt: new Date(),
    },
  });

  await prisma.user.delete({ where: { id } });
  await audit(ctx, "DELETE", "USER", id, {
    email: user.email,
    role: user.role,
    name: user.name,
  });
}

export async function updateOwnProfile(
  ctx: AdminContext,
  data: { name?: string; phone?: string; department?: string }
) {
  const existing = await prisma.user.findUnique({ where: { id: ctx.userId } });
  if (!existing) throw new AdminError("User not found", "NOT_FOUND");

  const user = await prisma.user.update({
    where: { id: ctx.userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      updatedAt: new Date(),
    },
    select: staffUserPublicSelect,
  });

  await audit(
    ctx,
    "UPDATE",
    "PROFILE",
    ctx.userId,
    data as Record<string, unknown>
  );
  return withMongoId(user);
}

export async function getAdminStats() {
  const [departments, designations, sites, users, activeUsers] =
    await Promise.all([
      prisma.department.count({ where: { isActive: true } }),
      prisma.designation.count({ where: { isActive: true } }),
      prisma.siteLocation.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);
  return { departments, designations, sites, users, activeUsers };
}

export { UserRole };
