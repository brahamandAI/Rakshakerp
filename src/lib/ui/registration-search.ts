export type RegistrationSearchField =
  | "fullName"
  | "fatherName"
  | "employeeId"
  | "accountNumber"
  | "aadhaarNumber"
  | "uanNo"
  | "esicNumber"
  | "phone"
  | "panNumber";

export const REGISTRATION_SEARCH_FIELD_OPTIONS: Array<{
  value: RegistrationSearchField;
  label: string;
}> = [
  { value: "fullName", label: "Employee Name" },
  { value: "fatherName", label: "Father's Name" },
  { value: "employeeId", label: "Employee Id" },
  { value: "accountNumber", label: "Bank Account Number" },
  { value: "aadhaarNumber", label: "Aadhaar Number" },
  { value: "uanNo", label: "UAN Number" },
  { value: "esicNumber", label: "ESIC Number" },
  { value: "phone", label: "Mobile Number" },
  { value: "panNumber", label: "Pan Number" },
];

export const DEFAULT_REGISTRATION_SEARCH_FIELD: RegistrationSearchField = "fullName";

export interface RegistrationSearchableFields {
  fullName?: string;
  fatherName?: string;
  employeeId?: string;
  temporaryEmployeeId?: string;
  employeeIdCode?: string;
  accountNumber?: string;
  aadhaarNumber?: string;
  uanNo?: string;
  esicNumber?: string;
  phone?: string;
  panNumber?: string;
}

/** Strip separators so partial ID / phone / Aadhaar searches still match. */
export function normalizeRegistrationSearchValue(
  field: RegistrationSearchField,
  value: string
): string {
  const trimmed = value.trim().toLowerCase();
  if (
    field === "aadhaarNumber" ||
    field === "accountNumber" ||
    field === "phone" ||
    field === "uanNo" ||
    field === "esicNumber" ||
    field === "employeeId" ||
    field === "panNumber"
  ) {
    return trimmed.replace(/[\s-_]/g, "");
  }
  return trimmed;
}

export function getRegistrationSearchValue(
  item: RegistrationSearchableFields,
  field: RegistrationSearchField
): string {
  switch (field) {
    case "fullName":
      return item.fullName ?? "";
    case "fatherName":
      return item.fatherName ?? "";
    case "employeeId":
      return [item.employeeId, item.temporaryEmployeeId, item.employeeIdCode]
        .filter(Boolean)
        .join(" ");
    case "accountNumber":
      return item.accountNumber ?? "";
    case "aadhaarNumber":
      return item.aadhaarNumber ?? "";
    case "uanNo":
      return item.uanNo ?? "";
    case "esicNumber":
      return item.esicNumber ?? "";
    case "phone":
      return item.phone ?? "";
    case "panNumber":
      return item.panNumber ?? "";
    default:
      return "";
  }
}

export function matchesRegistrationSearch(
  item: RegistrationSearchableFields,
  field: RegistrationSearchField,
  query: string
): boolean {
  const q = normalizeRegistrationSearchValue(field, query);
  if (!q) return true;
  const haystack = normalizeRegistrationSearchValue(
    field,
    getRegistrationSearchValue(item, field)
  );
  return haystack.includes(q);
}

export function pickSearchablePersonal(
  personal?: {
    fullName?: string;
    fatherName?: string;
    fatherOrHusbandName?: string;
    aadhaarNumber?: string;
    panNumber?: string;
  } | null
) {
  return {
    fatherName: personal?.fatherName ?? personal?.fatherOrHusbandName ?? "",
    aadhaarNumber: personal?.aadhaarNumber ?? "",
    panNumber: personal?.panNumber ?? "",
  };
}

export function pickSearchableAdditional(
  additional?: {
    uanNo?: string;
    esicNumber?: string;
    accountNumber?: string;
  } | null
) {
  return {
    uanNo: additional?.uanNo ?? "",
    esicNumber: additional?.esicNumber ?? "",
    accountNumber: additional?.accountNumber ?? "",
  };
}
