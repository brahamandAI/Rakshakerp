"use server";

import { cookies } from "next/headers";
import { encode } from "@auth/core/jwt";
import { signOut } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import {
  authenticateEmployeePortal,
  verifyEmployeeOtp,
  requestPasswordReset,
  resetPassword,
  logoutEmployee,
  AuthError,
} from "@/lib/services/auth.service";
import {
  staffLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  employeeLoginSchema,
  employeeOtpSchema,
} from "@/features/auth/schemas/auth.schema";
import { STAFF_ROLE_LABELS } from "@/features/auth/constants";
import {
  ACCOUNT_LOCK_MINUTES,
  MAX_LOGIN_ATTEMPTS,
  ROLE_DASHBOARD_PATH,
} from "@/types/enums";
import { canAccessRoute, isStaffRole } from "@/lib/auth/permissions";
import { requireStaffAuth } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: string };

function resolveStaffRedirect(
  role: keyof typeof ROLE_DASHBOARD_PATH,
  callbackUrl: string
): string {
  const defaultRedirect = ROLE_DASHBOARD_PATH[role];

  if (callbackUrl && callbackUrl.startsWith("/dashboard")) {
    if (canAccessRoute(role, callbackUrl)) {
      return callbackUrl;
    }
  }

  return defaultRedirect;
}

const STAFF_SESSION_MAX_AGE = 60 * 60 * 8;

function getStaffSessionCookieName(): string {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return url.startsWith("https://")
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

async function createStaffSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}): Promise<void> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET must be defined");
  }

  const cookieName = getStaffSessionCookieName();
  const token = await encode({
    token: {
      name: user.name,
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
    },
    secret,
    salt: cookieName,
    maxAge: STAFF_SESSION_MAX_AGE,
  });

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieName.startsWith("__Secure-"),
    maxAge: STAFF_SESSION_MAX_AGE,
  });
}

export async function staffLoginAction(
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  const callbackUrl = formData.get("callbackUrl")?.toString() ?? "";

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (!dbUser || !dbUser.isActive || !isStaffRole(dbUser.role)) {
      return {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
    }

    if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
      return {
        success: false,
        error: "Account is temporarily locked. Try again later.",
        code: "ACCOUNT_LOCKED",
      };
    }

    const isValid = await verifyPassword(
      parsed.data.password,
      dbUser.passwordHash
    );

    if (!isValid) {
      const failedLoginAttempts = dbUser.failedLoginAttempts + 1;
      const lockAccount = failedLoginAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: dbUser.id },
        data: lockAccount
          ? {
              failedLoginAttempts: 0,
              lockedUntil: new Date(
                Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000
              ),
            }
          : {
              failedLoginAttempts,
            },
      });

      return {
        success: false,
        error: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      };
    }

    if (dbUser.role !== parsed.data.role) {
      return {
        success: false,
        error: `Selected role does not match your account. Please choose "${STAFF_ROLE_LABELS[dbUser.role] ?? dbUser.role}".`,
        code: "ROLE_MISMATCH",
      };
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await createStaffSessionCookie({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    });

    const redirectTo = resolveStaffRedirect(dbUser.role, callbackUrl);
    return { success: true, data: { redirectTo } };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function staffLogoutAction(): Promise<ActionResult> {
  try {
    await signOut({ redirect: false });
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function employeeRequestOtpAction(
  formData: FormData
): Promise<
  ActionResult<{ maskedEmail: string; applicationRef: string; email: string }>
> {
  const parsed = employeeLoginSchema.safeParse({
    applicationRef: formData.get("applicationRef"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    const result = await authenticateEmployeePortal(
      parsed.data.applicationRef,
      parsed.data.email
    );

    return {
      success: true,
      data: {
        maskedEmail: result.maskedEmail,
        applicationRef: parsed.data.applicationRef.toUpperCase(),
        email: parsed.data.email.toLowerCase(),
      },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function employeeVerifyOtpAction(
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = employeeOtpSchema.safeParse({
    applicationRef: formData.get("applicationRef"),
    email: formData.get("email"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    const result = await verifyEmployeeOtp(
      parsed.data.applicationRef,
      parsed.data.email,
      parsed.data.otp
    );

    return { success: true, data: { redirectTo: result.redirectTo } };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function employeeLogoutAction(): Promise<ActionResult> {
  try {
    await logoutEmployee();
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    await requestPasswordReset(parsed.data.email);
    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message, code: error.code };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function changePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    };
  }

  try {
    const { user } = await requireStaffAuth();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      dbUser.passwordHash
    );
    if (!valid) {
      return { success: false, error: "Current password is incorrect" };
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        passwordChangedAt: new Date(),
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: "An unexpected error occurred" };
  }
}
