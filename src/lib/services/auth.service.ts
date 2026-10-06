import { prisma } from "@/lib/db/prisma";
import { hashPassword, hashToken, verifyToken } from "@/lib/auth/password";
import {
  createEmployeeSession,
  setEmployeeSessionCookie,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/employee-session";
import { generateOtp, getBaseUrl } from "@/lib/utils";
import { EmployeeStatus } from "@/types/enums";
import { AuthError } from "@/lib/auth/errors";
import crypto from "crypto";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export { AuthError };

/** 24-char hex id compatible with legacy ObjectId string format */
function newObjectIdString(): string {
  return crypto.randomBytes(12).toString("hex");
}

export async function authenticateEmployeePortal(
  applicationRef: string,
  email: string
): Promise<{ otpSent: boolean; maskedEmail: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRef = applicationRef.trim().toUpperCase();

  const employee = await prisma.employee.findFirst({
    where: {
      applicationRef: normalizedRef,
      email: normalizedEmail,
    },
    select: { id: true },
  });

  if (!employee) {
    throw new AuthError(
      "Invalid application reference or email",
      "INVALID_CREDENTIALS"
    );
  }

  const otp = generateOtp();
  const hashedOtp = await hashToken(otp);

  await prisma.otpToken.deleteMany({
    where: {
      applicationRef: normalizedRef,
      email: normalizedEmail,
    },
  });

  await prisma.otpToken.create({
    data: {
      id: newObjectIdString(),
      applicationRef: normalizedRef,
      email: normalizedEmail,
      hashedOtp,
      purpose: "FORM_ACCESS",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      attempts: 0,
    },
  });

  // Log OTP in development; integrate email provider in production
  if (process.env.NODE_ENV === "development") {
    console.info(`[DEV OTP] ${normalizedRef}: ${otp}`);
  }

  const maskedEmail = normalizedEmail.replace(
    /(.{1,2})(.*)(@.*)/,
    (_, a, b, c) => `${a}${"*".repeat(Math.min(b.length, 4))}${c}`
  );

  return { otpSent: true, maskedEmail };
}

export async function verifyEmployeeOtp(
  applicationRef: string,
  email: string,
  otp: string
): Promise<{ redirectTo: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRef = applicationRef.trim().toUpperCase();
  const now = new Date();

  const otpRecord = await prisma.otpToken.findFirst({
    where: {
      applicationRef: normalizedRef,
      email: normalizedEmail,
      usedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AuthError("OTP expired or not found", "OTP_EXPIRED");
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AuthError("Too many attempts. Request a new OTP.", "OTP_LOCKED");
  }

  const isValid = await verifyToken(otp, otpRecord.hashedOtp);

  if (!isValid) {
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });
    throw new AuthError("Invalid OTP", "OTP_INVALID");
  }

  await prisma.otpToken.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  });

  const employee = await prisma.employee.findFirst({
    where: {
      applicationRef: normalizedRef,
      email: normalizedEmail,
    },
    select: {
      id: true,
      applicationRef: true,
      email: true,
      status: true,
    },
  });

  if (!employee) {
    throw new AuthError("Application not found", "NOT_FOUND");
  }

  const token = await createEmployeeSession({
    employeeId: employee.id,
    applicationRef: employee.applicationRef,
    email: employee.email,
  });

  await setEmployeeSessionCookie(token);

  const editableStatuses: string[] = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];

  const redirectTo = editableStatuses.includes(employee.status)
    ? `/onboarding/${employee.applicationRef}`
    : `/application`;

  return { redirectTo };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, isActive: true },
  });

  // Always succeed silently to prevent email enumeration
  if (!user) return;

  const resetToken = await createPasswordResetToken(user.id, user.email);

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${getBaseUrl()}/staff/reset-password?token=${resetToken}`;

  if (process.env.NODE_ENV === "development") {
    console.info(`[DEV Reset URL] ${resetUrl}`);
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const payload = await verifyPasswordResetToken(token);
  if (!payload) {
    throw new AuthError("Invalid or expired reset link", "TOKEN_INVALID");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      email: payload.email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: now },
      isActive: true,
    },
  });

  if (!user) {
    throw new AuthError("Invalid or expired reset link", "TOKEN_INVALID");
  }

  if (newPassword.length < 8) {
    throw new AuthError(
      "Password must be at least 8 characters",
      "WEAK_PASSWORD"
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      passwordChangedAt: new Date(),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export async function logoutEmployee(): Promise<void> {
  const { clearEmployeeSessionCookie } = await import(
    "@/lib/auth/employee-session"
  );
  await clearEmployeeSessionCookie();
}
