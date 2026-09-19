import mongoose from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Setting } from "@/lib/db/models/Setting";
import { Department } from "@/lib/db/models/Department";
import { Designation } from "@/lib/db/models/Designation";
import { SiteLocation } from "@/lib/db/models/SiteLocation";
import { User } from "@/lib/db/models/User";
import { Employee } from "@/lib/db/models/Employee";
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

async function audit(ctx: AdminContext, action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
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

export async function getCompanyDetails(): Promise<CompanyDetails> {
  await connectDB();
  const doc = await Setting.findOne({ key: COMPANY_KEY }).lean();
  if (!doc) return DEFAULT_COMPANY;
  return toClientProps({ ...DEFAULT_COMPANY, ...(doc.value as unknown as CompanyDetails) });
}

export async function updateCompanyDetails(ctx: AdminContext, data: CompanyDetails): Promise<void> {
  await connectDB();
  await Setting.findOneAndUpdate(
    { key: COMPANY_KEY },
    { value: data },
    { upsert: true }
  );
  await audit(ctx, "UPDATE", "COMPANY", COMPANY_KEY, { name: data.name });
}

export async function getAppSettings(): Promise<AppSettings> {
  await connectDB();
  const doc = await Setting.findOne({ key: APP_SETTINGS_KEY }).lean();
  if (!doc) return DEFAULT_SETTINGS;
  return toClientProps({ ...DEFAULT_SETTINGS, ...(doc.value as unknown as AppSettings) });
}

export async function updateAppSettings(ctx: AdminContext, data: AppSettings): Promise<void> {
  await connectDB();
  await Setting.findOneAndUpdate(
    { key: APP_SETTINGS_KEY },
    { value: data },
    { upsert: true }
  );
  await audit(ctx, "UPDATE", "SETTINGS", APP_SETTINGS_KEY, data as unknown as Record<string, unknown>);
}

export async function listDepartments() {
  await connectDB();
  return Department.find().sort({ name: 1 }).lean();
}

export async function createDepartment(ctx: AdminContext, data: { name: string; code: string; description?: string }) {
  await connectDB();
  const existing = await Department.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AdminError("Department code already exists", "DUPLICATE");
  const dept = await Department.create({ ...data, code: data.code.toUpperCase() });
  await audit(ctx, "CREATE", "DEPARTMENT", String(dept._id), { name: data.name });
  return dept;
}

export async function updateDepartment(ctx: AdminContext, id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) {
  await connectDB();
  const dept = await Department.findByIdAndUpdate(id, data, { new: true });
  if (!dept) throw new AdminError("Department not found", "NOT_FOUND");
  await audit(ctx, "UPDATE", "DEPARTMENT", id, data as Record<string, unknown>);
  return dept;
}

export async function listDesignations() {
  await connectDB();
  return Designation.find().populate("departmentId", "name").sort({ name: 1 }).lean();
}

export async function createDesignation(ctx: AdminContext, data: { name: string; code: string; departmentId?: string; level?: number }) {
  await connectDB();
  const existing = await Designation.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AdminError("Designation code already exists", "DUPLICATE");
  const des = await Designation.create({
    name: data.name,
    code: data.code.toUpperCase(),
    departmentId: data.departmentId ? new mongoose.Types.ObjectId(data.departmentId) : undefined,
    level: data.level ?? 1,
  });
  await audit(ctx, "CREATE", "DESIGNATION", String(des._id), { name: data.name });
  return des;
}

export async function updateDesignation(ctx: AdminContext, id: string, data: Partial<{ name: string; level: number; isActive: boolean }>) {
  await connectDB();
  const des = await Designation.findByIdAndUpdate(id, data, { new: true });
  if (!des) throw new AdminError("Designation not found", "NOT_FOUND");
  await audit(ctx, "UPDATE", "DESIGNATION", id, data as Record<string, unknown>);
  return des;
}

export async function listSiteLocations() {
  await connectDB();
  return SiteLocation.find().sort({ name: 1 }).lean();
}

export async function createSiteLocation(ctx: AdminContext, data: {
  name: string; code: string; address?: string; city: string; state: string;
  pincode?: string; contactPerson?: string; contactPhone?: string;
}) {
  await connectDB();
  const existing = await SiteLocation.findOne({ code: data.code.toUpperCase() });
  if (existing) throw new AdminError("Site code already exists", "DUPLICATE");
  const site = await SiteLocation.create({ ...data, code: data.code.toUpperCase() });
  await audit(ctx, "CREATE", "SITE_LOCATION", String(site._id), { name: data.name });
  return site;
}

export async function updateSiteLocation(ctx: AdminContext, id: string, data: Partial<{
  name: string; address: string; city: string; state: string; pincode: string;
  contactPerson: string; contactPhone: string; isActive: boolean;
}>) {
  await connectDB();
  const site = await SiteLocation.findByIdAndUpdate(id, data, { new: true });
  if (!site) throw new AdminError("Site location not found", "NOT_FOUND");
  await audit(ctx, "UPDATE", "SITE_LOCATION", id, data as Record<string, unknown>);
  return site;
}

const MANAGEABLE_ROLES: StaffRole[] = [
  UserRole.SUBMITTER,
  UserRole.L1,
  UserRole.L2,
  UserRole.ADMIN,
];

export async function listStaffUsers() {
  await connectDB();
  return User.find({ role: { $in: MANAGEABLE_ROLES } })
    .sort({ createdAt: -1 })
    .select("-passwordHash -resetPasswordToken")
    .lean();
}

export async function createStaffUser(ctx: AdminContext, data: {
  name: string; email: string; password: string; role: StaffRole;
  department?: string; phone?: string;
}) {
  await connectDB();
  if (!MANAGEABLE_ROLES.includes(data.role)) {
    throw new AdminError("Invalid role for staff user creation", "FORBIDDEN");
  }
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new AdminError("Email already registered", "DUPLICATE");
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: await hashPassword(data.password),
    role: data.role,
    department: data.department,
    phone: data.phone,
    isActive: true,
    createdBy: new mongoose.Types.ObjectId(ctx.userId),
    failedLoginAttempts: 0,
  });
  await audit(ctx, "CREATE", "USER", String(user._id), { email: data.email, role: data.role });
  return user;
}

export async function updateStaffUser(ctx: AdminContext, id: string, data: Partial<{
  name: string; role: StaffRole; department: string; phone: string; isActive: boolean; password: string;
}>) {
  await connectDB();
  if (id === ctx.userId && data.isActive === false) {
    throw new AdminError("Cannot deactivate your own account", "FORBIDDEN");
  }
  const userToUpdate = await User.findById(id);
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
    const otherAdmins = await User.countDocuments({
      role: UserRole.ADMIN,
      _id: { $ne: userToUpdate._id },
      isActive: true,
    });
    if (otherAdmins === 0) {
      throw new AdminError("Cannot change the role of the last active admin", "FORBIDDEN");
    }
  }

  if (data.name !== undefined) userToUpdate.name = data.name;
  if (data.role !== undefined) userToUpdate.role = data.role;
  if (data.department !== undefined) userToUpdate.department = data.department;
  if (data.phone !== undefined) userToUpdate.phone = data.phone;
  if (data.isActive !== undefined) userToUpdate.isActive = data.isActive;
  if (data.password) {
    userToUpdate.passwordHash = await hashPassword(data.password);
    userToUpdate.passwordChangedAt = new Date();
    userToUpdate.resetPasswordToken = undefined;
    userToUpdate.resetPasswordExpires = undefined;
  }
  await userToUpdate.save();
  const user = await User.findById(id).select("-passwordHash");
  if (!user) throw new AdminError("User not found", "NOT_FOUND");
  const auditData = { ...data } as Record<string, unknown>;
  if ("password" in auditData) {
    auditData.password = "[REDACTED]";
  }
  await audit(ctx, "UPDATE", "USER", id, auditData);
  return user;
}

export async function deleteStaffUser(ctx: AdminContext, id: string): Promise<void> {
  await connectDB();
  if (id === ctx.userId) {
    throw new AdminError("Cannot delete your own account", "FORBIDDEN");
  }
  const user = await User.findById(id);
  if (!user) throw new AdminError("User not found", "NOT_FOUND");
  if (!MANAGEABLE_ROLES.includes(user.role as StaffRole)) {
    throw new AdminError("This user cannot be deleted here", "FORBIDDEN");
  }
  if (user.role === UserRole.ADMIN) {
    const otherAdmins = await User.countDocuments({
      role: UserRole.ADMIN,
      _id: { $ne: user._id },
      isActive: true,
    });
    if (otherAdmins === 0) {
      throw new AdminError("Cannot delete the last active admin", "FORBIDDEN");
    }
  }

  await Employee.updateMany(
    { submittedBy: user._id },
    {
      $set: {
        submittedByName: user.name,
        submittedByEmail: user.email,
      },
    }
  );

  await User.findByIdAndDelete(id);
  await audit(ctx, "DELETE", "USER", id, {
    email: user.email,
    role: user.role,
    name: user.name,
  });
}

export async function updateOwnProfile(ctx: AdminContext, data: { name?: string; phone?: string; department?: string }) {
  await connectDB();
  const user = await User.findByIdAndUpdate(ctx.userId, data, { new: true }).select("-passwordHash");
  if (!user) throw new AdminError("User not found", "NOT_FOUND");
  await audit(ctx, "UPDATE", "PROFILE", ctx.userId, data as Record<string, unknown>);
  return user;
}

export async function getAdminStats() {
  await connectDB();
  const [departments, designations, sites, users, activeUsers] = await Promise.all([
    Department.countDocuments({ isActive: true }),
    Designation.countDocuments({ isActive: true }),
    SiteLocation.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
  ]);
  return { departments, designations, sites, users, activeUsers };
}

export { UserRole };
