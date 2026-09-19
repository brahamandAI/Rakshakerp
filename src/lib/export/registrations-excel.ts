/** Flatten registration records into Excel-friendly rows and build an .xls (SpreadsheetML) file. */

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
  if (Array.isArray(value)) {
    return value
      .map((item, idx) => {
        if (item && typeof item === "object") {
          return Object.entries(item as Record<string, unknown>)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => `${k}: ${cell(v)}`)
            .join("; ");
        }
        return `${idx + 1}: ${cell(item)}`;
      })
      .filter(Boolean)
      .join(" | ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${k}: ${cell(v)}`)
      .join("; ");
  }
  return cell(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function arrayItem(arr: unknown[] | undefined, index: number): Record<string, unknown> {
  return asRecord(arr?.[index]);
}

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

function familyCols(max = 6): Col[] {
  const cols: Col[] = [];
  for (let i = 0; i < max; i++) {
    const n = i + 1;
    cols.push(
      {
        key: `family${n}Name`,
        header: `Family ${n} Name`,
        get: (r) => arrayItem(r.familyDetails, i).name,
      },
      {
        key: `family${n}Relationship`,
        header: `Family ${n} Relationship`,
        get: (r) => arrayItem(r.familyDetails, i).relationship,
      },
      {
        key: `family${n}Dob`,
        header: `Family ${n} Date of Birth`,
        get: (r) => arrayItem(r.familyDetails, i).dateOfBirth,
      },
      {
        key: `family${n}Aadhaar`,
        header: `Family ${n} Aadhaar`,
        get: (r) => arrayItem(r.familyDetails, i).aadhaarNumber,
      }
    );
  }
  return cols;
}

const COLUMNS: Col[] = [
  { key: "applicationRef", header: "Application Ref", get: (r) => r.applicationRef },
  { key: "status", header: "Status", get: (r) => r.status },
  { key: "employeeId", header: "Employee ID", get: (r) => r.employeeId },
  { key: "temporaryEmployeeId", header: "Temporary Employee ID", get: (r) => r.temporaryEmployeeId },
  { key: "submittedBy", header: "Submitted By", get: (r) => r.submittedBy?.name },
  { key: "submittedByEmail", header: "Submitter Email", get: (r) => r.submittedBy?.email },
  { key: "submittedAt", header: "Submitted At", get: (r) => r.submittedAt },
  { key: "l1Action", header: "L1 Action", get: (r) => r.l1Decision?.action },
  { key: "l1ApprovedBy", header: "L1 Approved By", get: (r) => r.l1Decision?.approvedByName || r.l1Decision?.decidedBy?.name },
  { key: "l1ApprovedAt", header: "L1 Approved At", get: (r) => r.l1ApprovedAt ?? r.l1Decision?.decidedAt },
  { key: "l1Comment", header: "L1 Comment", get: (r) => r.l1Decision?.comment },
  { key: "l2Action", header: "L2 Action", get: (r) => r.l2Decision?.action },
  { key: "l2ApprovedBy", header: "L2 Decision By", get: (r) => r.l2Decision?.decidedBy?.name },
  { key: "l2DecidedAt", header: "L2 Decided At", get: (r) => r.l2Decision?.decidedAt },
  { key: "l2Comment", header: "L2 Comment", get: (r) => r.l2Decision?.comment },
  { key: "approvedAt", header: "Approved At", get: (r) => r.approvedAt },
  { key: "idGeneratedAt", header: "ID Generated At", get: (r) => r.idGeneratedAt },
  { key: "forwardedToAdminAt", header: "Forwarded To Admin At", get: (r) => r.forwardedToAdminAt },
  { key: "correctionNotes", header: "Correction / Reverse Notes", get: (r) => r.correctionNotes },
  { key: "rejectionReason", header: "Rejection Reason", get: (r) => r.rejectionReason },
  { key: "email", header: "Email", get: (r) => r.email },
  { key: "phone", header: "Phone", get: (r) => r.phone },
  { key: "branchName", header: "Branch Name", get: (r) => r.personalDetails?.branchName },
  { key: "clientId", header: "Client ID", get: (r) => r.personalDetails?.clientId },
  { key: "clientName", header: "Client Name", get: (r) => r.personalDetails?.clientName },
  { key: "siteName", header: "Site Name", get: (r) => r.personalDetails?.siteName },
  { key: "dateOfJoining", header: "Date of Joining", get: (r) => r.personalDetails?.dateOfJoining },
  { key: "postAppliedFor", header: "Post Applied For", get: (r) => r.personalDetails?.postAppliedFor },
  { key: "fullName", header: "Full Name", get: (r) => r.personalDetails?.fullName },
  { key: "fatherName", header: "Father Name", get: (r) => r.personalDetails?.fatherName },
  { key: "motherName", header: "Mother Name", get: (r) => r.personalDetails?.motherName },
  { key: "spouseOrNok", header: "Spouse Name", get: (r) => r.personalDetails?.spouseOrNok },
  { key: "dateOfBirth", header: "Date of Birth", get: (r) => r.personalDetails?.dateOfBirth },
  { key: "maritalStatus", header: "Marital Status", get: (r) => r.personalDetails?.maritalStatus },
  { key: "bloodGroup", header: "Blood Group", get: (r) => r.personalDetails?.bloodGroup },
  { key: "aadhaarNumber", header: "Aadhaar Number", get: (r) => r.personalDetails?.aadhaarNumber },
  { key: "panNumber", header: "PAN Number", get: (r) => r.personalDetails?.panNumber },
  { key: "identificationMarks", header: "Identification Marks", get: (r) => r.personalDetails?.identificationMarks },
  { key: "localAddress", header: "Local Address", get: (r) => r.address?.localAddress },
  { key: "sameAsPresent", header: "Permanent Same As Local", get: (r) => r.address?.sameAsPresent },
  { key: "permanentAddress", header: "Permanent Address", get: (r) => r.address?.permanentAddress },
  {
    key: "educationalQualification",
    header: "Educational Qualification",
    get: (r) => r.education?.educationalQualification,
  },
  {
    key: "technicalQualification",
    header: "Technical Qualification",
    get: (r) => r.education?.technicalQualification,
  },
  { key: "ref1Name", header: "Reference 1 Name", get: (r) => arrayItem(r.references, 0).name },
  { key: "ref1Phone", header: "Reference 1 Phone", get: (r) => arrayItem(r.references, 0).phone },
  { key: "ref1Address", header: "Reference 1 Address", get: (r) => arrayItem(r.references, 0).address },
  { key: "ref2Name", header: "Reference 2 Name", get: (r) => arrayItem(r.references, 1).name },
  { key: "ref2Phone", header: "Reference 2 Phone", get: (r) => arrayItem(r.references, 1).phone },
  { key: "ref2Address", header: "Reference 2 Address", get: (r) => arrayItem(r.references, 1).address },
  ...familyCols(6),
  { key: "nomineeName", header: "Nominee Name", get: (r) => r.nominee?.name },
  { key: "nomineeRelationship", header: "Nominee Relationship", get: (r) => r.nominee?.relationship },
  { key: "nomineeDob", header: "Nominee Date of Birth", get: (r) => r.nominee?.dateOfBirth },
  { key: "nomineeAadhaar", header: "Nominee Aadhaar", get: (r) => r.nominee?.aadhaarNumber },
  { key: "isExServiceman", header: "Is Ex-Serviceman", get: (r) => r.exServiceman?.isExServiceman },
  {
    key: "armedForcesBranch",
    header: "Armed Forces Branch",
    get: (r) => r.exServiceman?.armedForcesBranch,
  },
  { key: "exRank", header: "Ex-Serviceman Rank", get: (r) => r.exServiceman?.rank },
  { key: "serviceNumber", header: "Service Number", get: (r) => r.exServiceman?.serviceNumber },
  { key: "dateOfDischarge", header: "Date of Discharge", get: (r) => r.exServiceman?.dateOfDischarge },
  { key: "unitLastServed", header: "Unit Last Served", get: (r) => r.exServiceman?.unitLastServed },
  { key: "isGunman", header: "Is Gunman", get: (r) => r.gunman?.isGunman },
  { key: "gunNumber", header: "Gun Number", get: (r) => r.gunman?.gunNumber },
  { key: "gunLicenseNumber", header: "Gun License Number", get: (r) => r.gunman?.licenseNumber },
  { key: "gunLicenseValidUpto", header: "Gun License Valid Upto", get: (r) => r.gunman?.licenseValidUpto },
  { key: "height", header: "Height", get: (r) => r.additionalDetails?.height },
  { key: "weight", header: "Weight", get: (r) => r.additionalDetails?.weight },
  { key: "eyeSight", header: "Eye Sight", get: (r) => r.additionalDetails?.eyeSight },
  { key: "eyeColor", header: "Eye Color", get: (r) => r.additionalDetails?.eyeColor },
  { key: "hearing", header: "Hearing", get: (r) => r.additionalDetails?.hearing },
  {
    key: "willingToWorkAnywhere",
    header: "Willing To Work Anywhere",
    get: (r) => r.additionalDetails?.willingToWorkAnywhere,
  },
  { key: "joiningTimeline", header: "Joining Timeline", get: (r) => r.additionalDetails?.joiningTimeline },
  { key: "previousEmployer", header: "Previous Employer", get: (r) => r.additionalDetails?.previousEmployer },
  { key: "uanNo", header: "UAN No", get: (r) => r.additionalDetails?.uanNo },
  { key: "esicNumber", header: "ESIC Number", get: (r) => r.additionalDetails?.esicNumber },
  { key: "bankName", header: "Bank Name", get: (r) => r.additionalDetails?.bankName },
  { key: "bankBranchName", header: "Bank Branch Name", get: (r) => r.additionalDetails?.bankBranchName },
  { key: "accountHolderName", header: "Account Holder Name", get: (r) => r.additionalDetails?.accountHolderName },
  { key: "accountNumber", header: "Account Number", get: (r) => r.additionalDetails?.accountNumber },
  { key: "ifscCode", header: "IFSC Code", get: (r) => r.additionalDetails?.ifscCode },
  {
    key: "drivingLicenseNumber",
    header: "Driving License No",
    get: (r) => r.additionalDetails?.drivingLicenseNumber,
  },
  {
    key: "drivingLicenseValidityDate",
    header: "DL Validity",
    get: (r) => r.additionalDetails?.drivingLicenseValidityDate,
  },
  {
    key: "trainingCertificateUpload",
    header: "Training Certificate",
    get: (r) => r.additionalDetails?.trainingCertificateUpload,
  },
  { key: "declarationAgreed", header: "Declaration Agreed", get: (r) => r.declaration?.agreed },
  {
    key: "policeVerificationAccepted",
    header: "Police Verification Accepted",
    get: (r) => r.declaration?.policeVerificationAccepted,
  },
  { key: "declarationPlace", header: "Declaration Place", get: (r) => r.declaration?.place },
  { key: "declarationSignedAt", header: "Declaration Signed At", get: (r) => r.declaration?.signedAt },
  {
    key: "hasLiveSignature",
    header: "Live Signature Provided",
    get: (r) =>
      typeof r.declaration?.signatureDataUrl === "string" &&
      (r.declaration.signatureDataUrl as string).startsWith("data:image/")
        ? "Yes"
        : "No",
  },
  { key: "documentsSummary", header: "Uploaded Documents", get: (r) => r.documentsSummary },
  { key: "documentFileNames", header: "Document File Names", get: (r) => r.documentFileNames },
  { key: "documentUrls", header: "Document URLs", get: (r) => r.documentUrls },
  { key: "documentsFolderName", header: "Documents Folder Name", get: (r) => r.documentsFolderName },
  { key: "documentsFolderPath", header: "Documents Folder Path", get: (r) => r.documentsFolderPath },
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
        const raw = c.get(row);
        const text = flattenValue(raw);
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
 <Worksheet ss:Name="Registrations">
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
