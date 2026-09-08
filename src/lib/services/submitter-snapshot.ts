import { User } from "@/lib/db/models/User";

export async function getSubmitterSnapshot(userId?: string | null): Promise<{
  submittedByName?: string;
  submittedByEmail?: string;
}> {
  if (!userId) return {};
  const user = await User.findById(userId).select("name email").lean();
  if (!user) return {};
  return {
    submittedByName: user.name,
    submittedByEmail: user.email,
  };
}

export function resolveSubmittedBy(employee: {
  submittedBy?: unknown;
  submittedByName?: unknown;
  submittedByEmail?: unknown;
}): { name?: string; email?: string } | null {
  const populated =
    employee.submittedBy && typeof employee.submittedBy === "object"
      ? (employee.submittedBy as { name?: unknown; email?: unknown })
      : null;
  const name =
    (typeof populated?.name === "string" && populated.name) ||
    (typeof employee.submittedByName === "string" && employee.submittedByName) ||
    undefined;
  const email =
    (typeof populated?.email === "string" && populated.email) ||
    (typeof employee.submittedByEmail === "string" && employee.submittedByEmail) ||
    undefined;
  if (!name && !email) return null;
  return { name, email };
}
