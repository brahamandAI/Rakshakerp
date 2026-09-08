"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaffAuth } from "@/lib/auth/guards";
import { UserRole } from "@/types/enums";
import {
  AdminError,
  updateCompanyDetails,
  updateAppSettings,
  createDepartment,
  updateDepartment,
  createDesignation,
  updateDesignation,
  createSiteLocation,
  updateSiteLocation,
  createStaffUser,
  updateStaffUser,
  deleteStaffUser,
  updateOwnProfile,
} from "@/lib/services/admin.service";
import { getAuditLogs } from "@/lib/services/audit.service";
import {
  companyDetailsSchema,
  appSettingsSchema,
  departmentSchema,
  designationSchema,
  siteLocationSchema,
  staffUserSchema,
  updateStaffUserSchema,
  profileUpdateSchema,
} from "@/features/admin/schemas/admin.schemas";

export type AdminActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string; code?: string };

function revalidateAdmin() {
  const paths = [
    "/dashboard/admin",
    "/dashboard/admin/settings",
    "/dashboard/admin/company",
    "/dashboard/admin/departments",
    "/dashboard/admin/designations",
    "/dashboard/admin/sites",
    "/dashboard/admin/users",
    "/dashboard/admin/audit-logs",
    "/dashboard/admin/profile",
  ];
  paths.forEach((p) => revalidatePath(p));
}

async function requireAdmin() {
  const { user } = await requireStaffAuth(UserRole.ADMIN);
  return {
    userId: user.id,
    userName: user.name,
    userRole: user.role,
  };
}

function handleError(error: unknown): AdminActionResult {
  if (error instanceof AdminError) {
    return { success: false, error: error.message, code: error.code };
  }
  return { success: false, error: "An unexpected error occurred" };
}

export async function updateCompanyDetailsAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = companyDetailsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid company details" };
  }
  try {
    await updateCompanyDetails(ctx, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAppSettingsAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = appSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid settings" };
  }
  try {
    await updateAppSettings(ctx, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function createDepartmentAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = departmentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid department data" };
  }
  try {
    const dept = await createDepartment(ctx, parsed.data);
    revalidateAdmin();
    return { success: true, data: { id: String(dept._id) } };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDepartmentAction(
  id: string,
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = departmentSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid department data" };
  }
  try {
    await updateDepartment(ctx, id, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function createDesignationAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = designationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid designation data" };
  }
  try {
    const des = await createDesignation(ctx, parsed.data);
    revalidateAdmin();
    return { success: true, data: { id: String(des._id) } };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDesignationAction(
  id: string,
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = designationSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid designation data" };
  }
  try {
    await updateDesignation(ctx, id, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function createSiteLocationAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = siteLocationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid site location data" };
  }
  try {
    const site = await createSiteLocation(ctx, parsed.data);
    revalidateAdmin();
    return { success: true, data: { id: String(site._id) } };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSiteLocationAction(
  id: string,
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = siteLocationSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid site location data" };
  }
  try {
    await updateSiteLocation(ctx, id, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function createStaffUserAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = staffUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid user data" };
  }
  try {
    const user = await createStaffUser(ctx, parsed.data);
    revalidateAdmin();
    return { success: true, data: { id: String(user._id) } };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateStaffUserAction(
  id: string,
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = updateStaffUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid user data" };
  }
  try {
    await updateStaffUser(ctx, id, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteStaffUserAction(
  id: string
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if (!id) {
    return { success: false, error: "Invalid user" };
  }
  try {
    await deleteStaffUser(ctx, id);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateProfileAction(
  data: unknown
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid profile data" };
  }
  try {
    await updateOwnProfile(ctx, parsed.data);
    revalidateAdmin();
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function fetchAuditLogsAction(): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const logs = await getAuditLogs(200);
    return { success: true, data: logs };
  } catch (error) {
    return handleError(error);
  }
}
