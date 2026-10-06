import { prisma } from "@/lib/db/prisma";

export class DuplicateApplicantError extends Error {
  constructor(
    message: string,
    public code = "DUPLICATE_APPLICANT"
  ) {
    super(message);
    this.name = "DuplicateApplicantError";
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function aadhaarVariants(aadhaar: string): string[] {
  const digits = digitsOnly(aadhaar);
  if (digits.length !== 12) return [];
  const spaced = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  return Array.from(new Set([digits, spaced, aadhaar.trim()]));
}

function phoneVariants(phone: string): string[] {
  const digits = digitsOnly(phone);
  if (digits.length < 10) return [];
  const last10 = digits.slice(-10);
  return Array.from(
    new Set([phone.trim(), digits, last10, `+91${last10}`, `91${last10}`])
  );
}

function isLikelyObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}

type PersonalDetailsShape = {
  fullName?: string;
  aadhaarNumber?: string;
};

function personalDetailsOf(value: unknown): PersonalDetailsShape {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as PersonalDetailsShape;
  }
  return {};
}

/**
 * Block creating/submitting another registration when Aadhaar, phone, or
 * full name already exists on a different application.
 * Pass `employeeId` as null when creating a brand-new registration.
 *
 * JSON fields (personalDetails.aadhaarNumber / fullName) are matched in
 * TypeScript after loading candidates, because Prisma JSON path filters are
 * awkward for $in / case-insensitive name matching. Phone uses a DB `in`
 * filter when available; otherwise we still scan candidates for phone/name/aadhaar.
 */
export async function assertNoDuplicateApplicant(
  employeeId: string | null,
  input: {
    fullName?: string;
    phone?: string;
    aadhaarNumber?: string;
  }
): Promise<void> {
  if (employeeId && !isLikelyObjectId(employeeId)) {
    throw new DuplicateApplicantError("Application not found", "NOT_FOUND");
  }

  const aadhaar = String(input.aadhaarNumber ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const fullName = String(input.fullName ?? "").trim();

  const aadhaarList = aadhaarVariants(aadhaar);
  const phones = phoneVariants(phone);

  if (aadhaarList.length === 0 && phones.length === 0 && !fullName) {
    return;
  }

  // Prefer phone-indexed candidates when we have phone variants; always also
  // load a broader set when checking name/aadhaar so we do not miss matches.
  const exclude = employeeId ? { id: { not: employeeId } } : {};

  let candidates: Array<{
    id: string;
    applicationRef: string;
    phone: string;
    personalDetails: unknown;
    status: string;
  }>;

  if (phones.length > 0 && aadhaarList.length === 0 && !fullName) {
    candidates = await prisma.employee.findMany({
      where: {
        ...exclude,
        phone: { in: phones },
      },
      select: {
        id: true,
        applicationRef: true,
        phone: true,
        personalDetails: true,
        status: true,
      },
    });
  } else {
    // Safe approach for Json personalDetails: load candidates (excluding self)
    // and filter Aadhaar / name / phone in TypeScript to preserve Mongo behavior.
    candidates = await prisma.employee.findMany({
      where: exclude,
      select: {
        id: true,
        applicationRef: true,
        phone: true,
        personalDetails: true,
        status: true,
      },
    });
  }

  const existing = candidates.find((row) => {
    const pd = personalDetailsOf(row.personalDetails);

    const aadhaarMatch =
      aadhaarList.length > 0 &&
      aadhaarList.some(
        (v) => digitsOnly(String(pd.aadhaarNumber ?? "")) === digitsOnly(v)
      );

    const phoneMatch =
      phones.length > 0 &&
      phones.some((v) =>
        digitsOnly(String(row.phone ?? "")).endsWith(digitsOnly(v).slice(-10))
      );

    const nameMatch =
      Boolean(fullName) &&
      normalizeName(String(pd.fullName ?? "")) === normalizeName(fullName);

    return aadhaarMatch || phoneMatch || nameMatch;
  });

  if (!existing) return;

  const existingPd = personalDetailsOf(existing.personalDetails);
  const matches: string[] = [];

  if (
    aadhaarList.length > 0 &&
    aadhaarList.some(
      (v) => digitsOnly(String(existingPd.aadhaarNumber ?? "")) === digitsOnly(v)
    )
  ) {
    matches.push("Aadhaar number");
  }
  if (
    phones.length > 0 &&
    phones.some((v) =>
      digitsOnly(String(existing.phone ?? "")).endsWith(digitsOnly(v).slice(-10))
    )
  ) {
    matches.push("phone number");
  }
  if (
    fullName &&
    normalizeName(String(existingPd.fullName ?? "")) === normalizeName(fullName)
  ) {
    matches.push("name");
  }

  const reason =
    matches.length > 0
      ? matches.join(", ")
      : "Aadhaar, name, or phone number";

  throw new DuplicateApplicantError(
    `This applicant already exists (matching ${reason}). Application ${existing.applicationRef} is already registered. Duplicate submissions are not allowed.`
  );
}
