import { z } from "zod";
import { UserRole } from "@/types/enums";

export const companyDetailsSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().min(5),
  website: z.string().url(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  founded: z.string().optional(),
});

export const appSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  otpExpiryMinutes: z.coerce.number().min(1).max(60),
  maxLoginAttempts: z.coerce.number().min(1).max(20),
  sessionTimeoutHours: z.coerce.number().min(1).max(24),
  allowEmployeeRegistration: z.boolean(),
});

export const departmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/),
  description: z.string().optional(),
});

export const designationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/),
  departmentId: z.string().optional(),
  level: z.coerce.number().min(1).max(10).optional(),
});

export const siteLocationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/),
  address: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
});

export const staffUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    UserRole.SUBMITTER,
    UserRole.L1,
    UserRole.L2,
    UserRole.SCANNING,
    UserRole.ADMIN,
  ]),
  department: z.string().optional(),
  phone: z.string().optional(),
});

export const updateStaffUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z
    .enum([
      UserRole.SUBMITTER,
      UserRole.L1,
      UserRole.L2,
      UserRole.SCANNING,
      UserRole.ADMIN,
    ])
    .optional(),
  password: z.string().min(8).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
});
