/** Payroll Sampleempdetails.xlsx-compatible Excel export (SpreadsheetML .xls). */

export type RegistrationExportSource = {
  applicationRef?: string;
  status?: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  temporaryEmployeeId?: string;
  submittedAt?: Date | string;
  l1ApprovedAt?: Date | string;
  approvedAt?: Date | string;
  idGeneratedAt?: Date | string;
  forwardedToAdminAt?: Date | string;
  correctionNotes?: string;
  rejectionReason?: string;
  personalDetails?: Record<string, unknown>;
  address?: Record<string, unknown>;
  education?: Record<string, unknown>;
  references?: unknown[];
  familyDetails?: unknown[];
  nominee?: Record<string, unknown>;
  exServiceman?: Record<string, unknown>;
  gunman?: Record<string, unknown>;
  additionalDetails?: Record<string, unknown>;
  declaration?: Record<string, unknown>;
  documentsSummary?: string;
  documentFileNames?: string;
  documentUrls?: string;
  documentsFolderName?: string;
  documentsFolderPath?: string;
  submittedBy?: { name?: string; email?: string } | null;
  l1Decision?: {
    action?: string;
    comment?: string;
    approvedByName?: string;
    decidedAt?: Date | string;
    decidedBy?: { name?: string } | null;
  };
  l2Decision?: {
    action?: string;
    comment?: string;
    decidedAt?: Date | string;
    decidedBy?: { name?: string } | null;
  };
};

type Col = {
  key: string;
  header: string;
  get: (r: RegistrationExportSource) => unknown;
};

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function flattenValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object") return cell(value);
  return cell(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

/** Convert HTML/ISO dates to YYYY/MM/DD for payroll sample format. */
export function formatPayrollDate(value: unknown): string {
  const raw = str(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}/${iso[2]}/${iso[3]}`;
  const slash = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slash) return raw.slice(0, 10);
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
  }
  return raw;
}

function digitsOnly(value: unknown): string {
  return str(value).replace(/\D/g, "");
}

function maritalCode(value: unknown): string {
  const v = str(value).toUpperCase();
  if (v === "SINGLE" || v === "S") return "S";
  if (v === "MARRIED" || v === "M") return "M";
  if (v === "WIDOWED" || v === "WIDOW" || v === "W") return "W";
  return v;
}

function sexCode(value: unknown): string {
  const v = str(value).toUpperCase();
  if (v === "MALE") return "M";
  if (v === "FEMALE") return "F";
  if (v === "M" || v === "F" || v === "O") return v;
  return v;
}

function yesNo(value: unknown, fallbackWhenNumber?: string): string {
  const v = str(value).toUpperCase();
  if (v === "YES" || v === "Y" || v === "TRUE") return "YES";
  if (v === "NO" || v === "N" || v === "FALSE") return "NO";
  if (!v && fallbackWhenNumber) return fallbackWhenNumber;
  return v;
}

function addressPart(
  r: RegistrationExportSource,
  which: "present" | "permanent"
): Record<string, unknown> {
  const addr = asRecord(r.address);
  const part = asRecord(addr[which]);
  if (Object.keys(part).length > 0) {
    if (!part.village && part.villageOrCity) part.village = part.villageOrCity;
    return part;
  }
  // Fallback: put free-text summary into landmark so export is not blank
  const summary =
    which === "present" ? str(addr.localAddress) : str(addr.permanentAddress);
  return summary ? { landmark: summary } : {};
}

function present(r: RegistrationExportSource) {
  return addressPart(r, "present");
}

function permanent(r: RegistrationExportSource) {
  const addr = asRecord(r.address);
  if (addr.sameAsPresent) return addressPart(r, "present");
  return addressPart(r, "permanent");
}

/** Exact Sampleempdetails.xlsx column order / headers. */
const COLUMNS: Col[] = [
  {
    key: "IDNO",
    header: "IDNO",
    get: (r) => r.employeeId || r.temporaryEmployeeId || "",
  },
  {
    key: "Employee Name",
    header: "Employee Name",
    get: (r) => r.personalDetails?.fullName,
  },
  {
    key: "Fathers Name",
    header: "Fathers Name",
    get: (r) =>
      r.personalDetails?.fatherName || r.personalDetails?.fatherOrHusbandName,
  },
  {
    key: "Mother Name",
    header: "Mother Name",
    get: (r) => r.personalDetails?.motherName,
  },
  {
    key: "Date of Birth",
    header: "Date of Birth",
    get: (r) => formatPayrollDate(r.personalDetails?.dateOfBirth),
  },
  {
    key: "Sex",
    header: "Sex",
    get: (r) => sexCode(r.personalDetails?.gender),
  },
  {
    key: "Marital Status",
    header: "Marital Status",
    get: (r) => maritalCode(r.personalDetails?.maritalStatus),
  },
  {
    key: "Designation",
    header: "Designation",
    get: (r) =>
      r.personalDetails?.designationCode || r.personalDetails?.postAppliedFor,
  },
  {
    key: "Mobile No",
    header: "Mobile No",
    get: (r) => digitsOnly(r.phone),
  },
  {
    key: "UAN Number",
    header: "UAN Number",
    get: (r) => digitsOnly(r.additionalDetails?.uanNo),
  },
  {
    key: "Aadhar Number",
    header: "Aadhar Number",
    get: (r) => digitsOnly(r.personalDetails?.aadhaarNumber),
  },
  {
    key: "PAN Number",
    header: "PAN Number",
    get: (r) => str(r.personalDetails?.panNumber).toUpperCase(),
  },
  {
    key: "Present Landmark",
    header: "Present Landmark",
    get: (r) => present(r).landmark,
  },
  {
    key: "Present Village",
    header: "Present Village",
    get: (r) => present(r).village,
  },
  {
    key: "Present PostOffice",
    header: "Present PostOffice",
    get: (r) => present(r).postOffice,
  },
  {
    key: "Present Taluka",
    header: "Present Taluka",
    get: (r) => present(r).taluka,
  },
  {
    key: "Present PolicesStation",
    header: "Present PolicesStation",
    get: (r) => present(r).policeStation,
  },
  {
    key: "Present State",
    header: "Present State",
    get: (r) => present(r).state,
  },
  {
    key: "Present District",
    header: "Present District",
    get: (r) => present(r).district,
  },
  {
    key: "Present Pincode",
    header: "Present Pincode",
    get: (r) => present(r).pincode,
  },
  {
    key: "Present DateSinceResiding",
    header: "Present DateSinceResiding",
    get: (r) => formatPayrollDate(present(r).dateSinceResiding),
  },
  {
    key: "Present PeriodOfStay",
    header: "Present PeriodOfStay",
    get: (r) => present(r).periodOfStay,
  },
  {
    key: "Present Phone",
    header: "Present Phone",
    get: (r) => digitsOnly(present(r).phone || r.phone),
  },
  {
    key: "Permanent Landmark",
    header: "Permanent Landmark",
    get: (r) => permanent(r).landmark,
  },
  {
    key: "Permanent Village",
    header: "Permanent Village",
    get: (r) => permanent(r).village,
  },
  {
    key: "Permanent PostOffice",
    header: "Permanent PostOffice",
    get: (r) => permanent(r).postOffice,
  },
  {
    key: "Permanent Taluka",
    header: "Permanent Taluka",
    get: (r) => permanent(r).taluka,
  },
  {
    key: "Permanent PolicesStation",
    header: "Permanent PolicesStation",
    get: (r) => permanent(r).policeStation,
  },
  {
    key: "Permanent State",
    header: "Permanent State",
    get: (r) => permanent(r).state,
  },
  {
    key: "Permanent District",
    header: "Permanent District",
    get: (r) => permanent(r).district,
  },
  {
    key: "Permanent Pincode",
    header: "Permanent Pincode",
    get: (r) => permanent(r).pincode,
  },
  {
    key: "Permanent DateSinceResiding",
    header: "Permanent DateSinceResiding",
    get: (r) => formatPayrollDate(permanent(r).dateSinceResiding),
  },
  {
    key: "Permanent PeriodOfStay",
    header: "Permanent PeriodOfStay",
    get: (r) => permanent(r).periodOfStay,
  },
  {
    key: "Permanent Phone",
    header: "Permanent Phone",
    get: (r) => digitsOnly(permanent(r).phone || r.phone),
  },
  {
    key: "Department",
    header: "Department",
    get: (r) => r.personalDetails?.department,
  },
  {
    key: "Client ID",
    header: "Client ID",
    get: (r) => r.personalDetails?.clientId,
  },
  {
    key: "Branch",
    header: "Branch",
    get: (r) => r.personalDetails?.branchName,
  },
  {
    key: "Division",
    header: "Division",
    get: (r) => r.personalDetails?.division,
  },
  {
    key: "Bank Account No",
    header: "Bank Account No",
    get: (r) => digitsOnly(r.additionalDetails?.accountNumber),
  },
  {
    key: "IFSC",
    header: "IFSC",
    get: (r) => str(r.additionalDetails?.ifscCode).toUpperCase(),
  },
  {
    key: "Bank Name",
    header: "Bank Name",
    get: (r) => r.additionalDetails?.bankName,
  },
  {
    key: "Date of Joining",
    header: "Date of Joining",
    get: (r) => formatPayrollDate(r.personalDetails?.dateOfJoining),
  },
  {
    key: "Date of leaving",
    header: "Date of leaving",
    get: (r) => formatPayrollDate(r.personalDetails?.dateOfLeaving),
  },
  {
    key: "ESI Applicable",
    header: "ESI Applicable",
    get: (r) =>
      yesNo(
        r.additionalDetails?.esiApplicable,
        str(r.additionalDetails?.esicNumber) ? "YES" : ""
      ),
  },
  {
    key: "ESI No",
    header: "ESI No",
    get: (r) => str(r.additionalDetails?.esicNumber),
  },
  {
    key: "PF Applicable",
    header: "PF Applicable",
    get: (r) =>
      yesNo(
        r.additionalDetails?.pfApplicable,
        str(r.additionalDetails?.uanNo) || str(r.additionalDetails?.pfNumber)
          ? "YES"
          : ""
      ),
  },
  {
    key: "PF No",
    header: "PF No",
    get: (r) =>
      str(r.additionalDetails?.pfNumber) ||
      digitsOnly(r.additionalDetails?.uanNo),
  },
  {
    key: "PT Applicable",
    header: "PT Applicable",
    get: (r) => yesNo(r.additionalDetails?.ptApplicable),
  },
  {
    key: "Employee Type",
    header: "Employee Type",
    get: (r) => str(r.personalDetails?.employeeType) || "G",
  },
  {
    key: "Old Emp ID",
    header: "Old Emp ID",
    get: (r) => r.personalDetails?.oldEmpId,
  },
];

export function getExcelColumnCount(): number {
  return COLUMNS.length;
}

export function buildRegistrationsExcelXml(rows: RegistrationExportSource[]): string {
  const headerCells = COLUMNS.map(
    (c) => `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`
  ).join("");

  const body = rows
    .map((row) => {
      const cells = COLUMNS.map((c) => {
        const text = flattenValue(c.get(row));
        return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
      }).join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="EmployeeDetails">
  <Table>
   <Row>${headerCells}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function getExportPreviewRows(
  sources: RegistrationExportSource[],
  limit = 25
): {
  count: number;
  columns: string[];
  rows: Record<string, string>[];
} {
  const previewSources = sources.slice(0, limit);
  const columns = COLUMNS.map((c) => c.header);
  const rows = previewSources.map((source) => {
    const row: Record<string, string> = {};
    for (const col of COLUMNS) {
      row[col.header] = flattenValue(col.get(source));
    }
    return row;
  });
  return { count: sources.length, columns, rows };
}
