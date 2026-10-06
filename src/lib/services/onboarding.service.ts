import { prisma } from "@/lib/db/prisma";
import { newObjectIdString } from "@/lib/db/ids";
import { Prisma } from "@/generated/prisma/client";
import {
  uploadDocumentToCloudinary,
  deleteDocumentFromCloudinary,
} from "@/lib/cloudinary/upload";
import { isAllowedUpload, normalizeMimeType } from "@/lib/files/mime";
import {
  DocumentType,
  MAX_FILE_SIZE,
  ONBOARDING_TOTAL_STEPS,
  getRequiredDocuments,
} from "@/features/onboarding/constants";
import {
  EmployeeFormData,
  DocumentRecord,
  OnboardingEmployee,
  EducationDetails,
} from "@/features/onboarding/types";
import { EmployeeStatus } from "@/types/enums";
import { STEP_SCHEMAS } from "@/features/onboarding/schemas/onboarding.schema";
import { computeFieldChanges } from "@/lib/utils/field-changes";
import { toClientProps } from "@/lib/serialize/client-props";
import { getSubmitterSnapshot } from "@/lib/services/submitter-snapshot";

export class OnboardingError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "OnboardingError";
  }
}

type JsonObject = Record<string, unknown>;

function asInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Employee row shape used while applying step mutations before Prisma update. */
type EmployeeRow = {
  id: string;
  applicationRef: string;
  status: string;
  email: string;
  phone: string;
  currentStep: number;
  completedSteps: unknown;
  personalDetails: unknown;
  address: unknown;
  education: unknown;
  references: unknown;
  familyDetails: unknown;
  nominee: unknown;
  exServiceman: unknown;
  gunman: unknown;
  additionalDetails: unknown;
  declaration: unknown;
  correctionNotes: string | null;
  correctionSteps: unknown;
  rejectionReason: string | null;
  submittedSnapshot: unknown;
  pendingFieldChanges: unknown;
  submittedBy: string | null;
  submittedByName: string | null;
  submittedByEmail: string | null;
  submittedAt: Date | null;
  lastSavedAt: Date | null;
  l1Decision: unknown;
  l2Decision: unknown;
};

type DocumentRow = {
  id: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: Date;
};

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

function completedStepsOf(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((s): s is number => typeof s === "number")
    : [];
}

/** Convert nested values to plain JSON-safe objects (prevents RSC serialize stack overflow). */
function toPlain<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  try {
    if (typeof value === "object" && value !== null && "toObject" in value) {
      const withToObject = value as { toObject: (opts?: object) => unknown };
      return JSON.parse(
        JSON.stringify(withToObject.toObject({ depopulate: true, flattenMaps: true }))
      ) as T;
    }
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return fallback;
  }
}

function normalizeEducation(raw: unknown): EducationDetails {
  const plain = toPlain<unknown>(raw, {});
  if (Array.isArray(plain)) {
    const first = plain[0] as { qualification?: string; institution?: string } | undefined;
    return {
      educationalQualification: first?.qualification ?? "",
      technicalQualification: first?.institution ?? "",
      entries: plain as EducationDetails["entries"],
    };
  }
  if (plain && typeof plain === "object") {
    return plain as EducationDetails;
  }
  return {};
}

function composeAddressLine(part?: Record<string, string> | null): string {
  if (!part) return "";
  return [
    part.landmark,
    part.houseNo,
    part.street,
    part.village ?? part.villageOrCity,
    part.postOffice,
    part.taluka,
    part.policeStation,
    part.district,
    part.state,
    part.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeAddress(raw: unknown): EmployeeFormData["address"] {
  const addr = toPlain<EmployeeFormData["address"]>(raw, {});
  const present = toPlain<Record<string, string>>(addr.present, {});
  const permanent = toPlain<Record<string, string>>(addr.permanent, {});

  const localAddress =
    addr.localAddress ||
    composeAddressLine(present) ||
    "";
  const permanentAddress =
    addr.permanentAddress ||
    composeAddressLine(permanent) ||
    "";

  return {
    localAddress,
    permanentAddress,
    sameAsPresent: Boolean(addr.sameAsPresent),
    present: Object.keys(present).length ? present : undefined,
    permanent: Object.keys(permanent).length ? permanent : undefined,
  };
}

function normalizePersonal(raw: unknown): EmployeeFormData["personalDetails"] {
  const pd = toPlain<EmployeeFormData["personalDetails"]>(raw, {});
  const blood = String(pd.bloodGroup ?? "").trim();
  const marital = String(pd.maritalStatus ?? "").trim().toUpperCase();
  const validMarital =
    marital === "SINGLE" || marital === "MARRIED" || marital === "WIDOWED"
      ? marital
      : undefined;
  const validBlood = blood || undefined;

  const genderRaw = String(pd.gender ?? "").trim().toUpperCase();
  const validGender =
    genderRaw === "M" || genderRaw === "F" || genderRaw === "O"
      ? genderRaw
      : genderRaw === "MALE"
        ? "M"
        : genderRaw === "FEMALE"
          ? "F"
          : undefined;

  return {
    branchName: pd.branchName ?? "",
    clientId: pd.clientId ?? "",
    clientName: pd.clientName ?? "",
    siteName: pd.siteName ?? "",
    dateOfJoining: String(pd.dateOfJoining ?? "").trim(),
    dateOfLeaving: pd.dateOfLeaving ?? "",
    postAppliedFor: pd.postAppliedFor ?? "",
    designationCode: pd.designationCode ?? "",
    department: pd.department ?? "",
    division: pd.division ?? "",
    employeeType: pd.employeeType ?? "G",
    oldEmpId: pd.oldEmpId ?? "",
    fullName: pd.fullName ?? "",
    fatherName: pd.fatherName ?? pd.fatherOrHusbandName ?? "",
    motherName: pd.motherName ?? "",
    spouseOrNok: pd.spouseOrNok ?? "",
    dateOfBirth: pd.dateOfBirth ?? "",
    gender: validGender,
    bloodGroup: validBlood,
    maritalStatus: validMarital,
    aadhaarNumber: pd.aadhaarNumber ?? "",
    panNumber: pd.panNumber ?? "",
    identificationMarks: pd.identificationMarks ?? "",
  };
}

function mapEmployeeToFormData(employee: {
  personalDetails: unknown;
  address: unknown;
  education: unknown;
  references: unknown;
  familyDetails: unknown;
  nominee: unknown;
  exServiceman: unknown;
  gunman: unknown;
  additionalDetails: unknown;
  declaration: unknown;
}): EmployeeFormData {
  const gunman = toPlain<EmployeeFormData["gunman"]>(employee.gunman, {
    isGunman: false,
  });
  const additional = toPlain<EmployeeFormData["additionalDetails"]>(
    employee.additionalDetails,
    {}
  );
  const personal = normalizePersonal(employee.personalDetails);

  if (!String(personal.dateOfJoining ?? "").trim()) {
    const fallback =
      String(additional.joiningTimeline ?? "").trim() ||
      String((additional as { expectedDateOfJoining?: string }).expectedDateOfJoining ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(fallback)) {
      personal.dateOfJoining = fallback.slice(0, 10);
    }
  }

  const declaration = toPlain<EmployeeFormData["declaration"]>(
    employee.declaration,
    {}
  );

  return {
    personalDetails: personal,
    address: normalizeAddress(employee.address),
    education: normalizeEducation(employee.education),
    references: toPlain<EmployeeFormData["references"]>(employee.references, []),
    familyDetails: toPlain<EmployeeFormData["familyDetails"]>(
      employee.familyDetails,
      []
    ),
    nominee: toPlain<EmployeeFormData["nominee"]>(employee.nominee, {}),
    exServiceman: toPlain<EmployeeFormData["exServiceman"]>(employee.exServiceman, {
      isExServiceman: false,
    }),
    gunman: gunman?.isGunman != null ? gunman : { isGunman: false },
    additionalDetails: additional,
    declaration: {
      agreed: Boolean(declaration.agreed),
      policeVerificationAccepted: Boolean(declaration.policeVerificationAccepted),
      place: declaration.place ?? "",
      signatureDataUrl: declaration.signatureDataUrl ?? "",
      signedAt: declaration.signedAt,
    },
  };
}

function getDefaultFormData(fullName?: string): EmployeeFormData {
  return {
    personalDetails: {
      branchName: "",
      clientId: "",
      clientName: "",
      siteName: "",
      dateOfJoining: "",
      fullName,
      postAppliedFor: "",
    },
    address: { localAddress: "", permanentAddress: "", sameAsPresent: false },
    education: { educationalQualification: "", technicalQualification: "" },
    references: [
      { name: "", phone: "", address: "" },
      { name: "", phone: "", address: "" },
    ],
    familyDetails: [{ name: "", relationship: "", dateOfBirth: "", aadhaarNumber: "" }],
    nominee: {},
    exServiceman: { isExServiceman: false },
    gunman: { isGunman: false },
    additionalDetails: {},
    declaration: {},
  };
}

export async function getOnboardingEmployee(
  employeeId: string
): Promise<OnboardingEmployee | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) return null;

  const documents = await prisma.employeeDocument.findMany({
    where: { employeeId: employee.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const formData = mapEmployeeToFormData(employee);
  if (!formData.personalDetails.fullName) {
    const legacy = toPlain<{ fullName?: string }>(employee.personalDetails, {});
    formData.personalDetails.fullName = legacy.fullName ?? "";
  }

  const pendingFieldChanges = toPlain<OnboardingEmployee["pendingFieldChanges"]>(
    employee.pendingFieldChanges,
    []
  );

  const completedSteps = completedStepsOf(employee.completedSteps);

  return toClientProps({
    _id: employee.id,
    applicationRef: employee.applicationRef,
    status: employee.status as EmployeeStatus,
    email: employee.email,
    phone: employee.phone,
    currentStep: Math.min(employee.currentStep || 1, ONBOARDING_TOTAL_STEPS),
    completedSteps: completedSteps.filter((s) => s <= ONBOARDING_TOTAL_STEPS),
    correctionNotes: employee.correctionNotes ?? undefined,
    correctionSteps: Array.isArray(employee.correctionSteps)
      ? [...(employee.correctionSteps as number[])]
      : undefined,
    pendingFieldChanges,
    formData,
    documents: documents.map(mapDocumentRecord),
    lastSavedAt: employee.lastSavedAt?.toISOString(),
  });
}

function mapDocumentRecord(doc: DocumentRow): DocumentRecord {
  return {
    _id: doc.id,
    documentType: doc.documentType as DocumentType,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    url: doc.url,
    uploadedAt: doc.createdAt.toISOString(),
  };
}

export function mapStep1DataToEmployeeFields(data: Record<string, unknown>) {
  const payload = data as {
    personalDetails: Record<string, unknown>;
    address: {
      localAddress: string;
      permanentAddress?: string;
      sameAsPresent: boolean;
      present?: Record<string, string>;
      permanent?: Record<string, string>;
    };
    education: { educationalQualification: string; technicalQualification?: string };
    additionalDetails: Record<string, unknown>;
  };

  const present = payload.address.present ?? {};
  const permanent = payload.address.sameAsPresent
    ? present
    : payload.address.permanent ?? {};

  return {
    personalDetails: payload.personalDetails,
    address: {
      localAddress: payload.address.localAddress,
      permanentAddress: payload.address.sameAsPresent
        ? payload.address.localAddress
        : payload.address.permanentAddress ?? "",
      sameAsPresent: payload.address.sameAsPresent,
      present,
      permanent,
    },
    education: payload.education,
    additionalDetails: payload.additionalDetails,
  };
}

function applyStepData(
  employee: EmployeeRow,
  step: number,
  data: Record<string, unknown>
) {
  switch (step) {
    case 1: {
      const fields = mapStep1DataToEmployeeFields(data);
      employee.personalDetails = fields.personalDetails;
      employee.address = fields.address;
      employee.education = fields.education;
      employee.additionalDetails = {
        ...asJsonObject(employee.additionalDetails),
        ...fields.additionalDetails,
      };
      break;
    }
    case 2:
      employee.references = (data.references as Record<string, unknown>[]) ?? [];
      break;
    case 3:
      employee.familyDetails = (data.familyDetails as Record<string, unknown>[]) ?? [];
      break;
    case 4:
      employee.nominee = data.nominee as JsonObject;
      break;
    case 5: {
      employee.exServiceman = data.exServiceman as JsonObject;
      employee.gunman = data.gunman as JsonObject;
      if (data.additionalDetails) {
        employee.additionalDetails = {
          ...asJsonObject(employee.additionalDetails),
          ...(data.additionalDetails as JsonObject),
        };
      }
      break;
    }
    case 7: {
      const declaration = data.declaration as Record<string, unknown> | undefined;
      if (declaration && Object.keys(declaration).length > 0) {
        employee.declaration = {
          ...declaration,
          signedAt: new Date().toISOString(),
        };
      }
      break;
    }
  }
}

function getStepDataForValidation(formData: EmployeeFormData, step: number): unknown {
  switch (step) {
    case 1:
      return {
        personalDetails: formData.personalDetails,
        address: formData.address,
        education: formData.education,
        additionalDetails: {
          height: formData.additionalDetails.height,
          weight: formData.additionalDetails.weight,
          eyeSight: formData.additionalDetails.eyeSight,
          eyeColor: formData.additionalDetails.eyeColor,
          hearing: formData.additionalDetails.hearing,
          willingToWorkAnywhere: formData.additionalDetails.willingToWorkAnywhere ?? false,
          joiningTimeline: formData.additionalDetails.joiningTimeline,
          previousEmployer: formData.additionalDetails.previousEmployer,
          uanNo: formData.additionalDetails.uanNo,
          esicNumber: formData.additionalDetails.esicNumber,
          esiApplicable: formData.additionalDetails.esiApplicable,
          pfApplicable: formData.additionalDetails.pfApplicable,
          ptApplicable: formData.additionalDetails.ptApplicable,
          bankName: formData.additionalDetails.bankName,
          bankCode: formData.additionalDetails.bankCode,
          bankBranchName: formData.additionalDetails.bankBranchName,
          accountHolderName: formData.additionalDetails.accountHolderName,
          accountNumber: formData.additionalDetails.accountNumber,
          ifscCode: formData.additionalDetails.ifscCode,
        },
      };
    case 2:
      return { references: formData.references };
    case 3:
      return { familyDetails: formData.familyDetails };
    case 4:
      return { nominee: formData.nominee };
    case 5:
      return {
        exServiceman: formData.exServiceman,
        gunman: formData.gunman,
        additionalDetails: {
          drivingLicenseNumber: formData.additionalDetails.drivingLicenseNumber,
          drivingLicenseValidityDate: formData.additionalDetails.drivingLicenseValidityDate,
          trainingCertificateUpload: formData.additionalDetails.trainingCertificateUpload,
        },
      };
    case 7:
      return { declaration: formData.declaration };
    default:
      return null;
  }
}

const EDITABLE_STATUSES = [
  EmployeeStatus.DRAFT,
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
];

export async function saveOnboardingStep(
  employeeId: string,
  step: number,
  data: Record<string, unknown>,
  options: { validate?: boolean; markComplete?: boolean } = {}
): Promise<{ savedAt: string }> {
  if (step < 1 || step > ONBOARDING_TOTAL_STEPS) {
    throw new OnboardingError("Invalid step", "INVALID_STEP");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }

  if (!EDITABLE_STATUSES.includes(employee.status as EmployeeStatus)) {
    throw new OnboardingError("Application is locked", "LOCKED");
  }

  if (options.validate && step !== 6) {
    const schema = STEP_SCHEMAS[step as keyof typeof STEP_SCHEMAS];
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new OnboardingError(
          result.error.errors[0]?.message ?? "Validation failed",
          "VALIDATION_ERROR"
        );
      }
    }
  }

  const draft: EmployeeRow = {
    ...employee,
    completedSteps: completedStepsOf(employee.completedSteps),
  };

  if (step !== 6) {
    applyStepData(draft, step, data);
  }

  if (draft.currentStep > ONBOARDING_TOTAL_STEPS) {
    draft.currentStep = ONBOARDING_TOTAL_STEPS;
  }

  let completedSteps = completedStepsOf(draft.completedSteps).filter(
    (s) => s >= 1 && s <= ONBOARDING_TOTAL_STEPS
  );

  if (options.markComplete && !completedSteps.includes(step)) {
    completedSteps = [...completedSteps, step].sort((a, b) => a - b);
  }

  let pendingFieldChanges: unknown = draft.pendingFieldChanges;
  if (draft.submittedSnapshot) {
    const current = mapEmployeeToFormData(draft) as unknown as Record<string, unknown>;
    pendingFieldChanges = computeFieldChanges(
      draft.submittedSnapshot as Record<string, unknown>,
      current
    );
  }

  const lastSavedAt = new Date();
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      personalDetails: asInputJson(draft.personalDetails),
      address: asInputJson(draft.address),
      education: asInputJson(draft.education),
      references: asInputJson(draft.references),
      familyDetails: asInputJson(draft.familyDetails),
      nominee: asInputJson(draft.nominee),
      exServiceman: asInputJson(draft.exServiceman),
      gunman: asInputJson(draft.gunman),
      additionalDetails: asInputJson(draft.additionalDetails),
      declaration: asInputJson(draft.declaration),
      currentStep: draft.currentStep,
      completedSteps: asInputJson(completedSteps),
      pendingFieldChanges: asInputJson(pendingFieldChanges),
      lastSavedAt,
      updatedAt: lastSavedAt,
    },
  });

  return { savedAt: lastSavedAt.toISOString() };
}

export async function updateCurrentStep(
  employeeId: string,
  step: number
): Promise<void> {
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      currentStep: Math.min(Math.max(step, 1), ONBOARDING_TOTAL_STEPS),
      updatedAt: new Date(),
    },
  });
}

export async function uploadEmployeeDocument(
  employeeId: string,
  documentType: DocumentType,
  file: File
): Promise<DocumentRecord> {
  if (!isAllowedUpload(file.name, file.type)) {
    throw new OnboardingError(
      "Only JPG, PNG, WEBP, and PDF files are allowed",
      "INVALID_FILE_TYPE"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new OnboardingError("File size must be under 5MB", "FILE_TOO_LARGE");
  }

  const mimeType = normalizeMimeType(file.name, file.type);

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, status: true, applicationRef: true },
  });
  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }

  if (!EDITABLE_STATUSES.includes(employee.status as EmployeeStatus)) {
    throw new OnboardingError("Application is locked", "LOCKED");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let cloudinaryResult;
  try {
    cloudinaryResult = await uploadDocumentToCloudinary(
      buffer,
      employee.applicationRef,
      documentType,
      file.name,
      file.type
    );
  } catch (error) {
    const raw = error instanceof Error ? error.message : "Cloudinary upload failed";
    const message = raw.includes("Invalid Signature")
      ? "Cloudinary API secret is invalid. Copy the real API Secret from your Cloudinary dashboard into CLOUDINARY_API_SECRET (not masked stars)."
      : raw;
    throw new OnboardingError(message, "UPLOAD_FAILED");
  }

  const existingDoc = await prisma.employeeDocument.findFirst({
    where: { employeeId: employee.id, documentType, isActive: true },
  });

  const previousUrl = existingDoc?.url;
  let doc: DocumentRow;
  const now = new Date();

  if (existingDoc) {
    doc = await prisma.employeeDocument.update({
      where: { id: existingDoc.id },
      data: {
        fileName: file.name,
        mimeType,
        sizeBytes: cloudinaryResult.bytes,
        url: cloudinaryResult.url,
        version: existingDoc.version + 1,
        uploadedBy: "EMPLOYEE",
        updatedAt: now,
      },
    });
  } else {
    try {
      doc = await prisma.employeeDocument.create({
        data: {
          id: newObjectIdString(),
          employeeId: employee.id,
          documentType,
          fileName: file.name,
          mimeType,
          sizeBytes: cloudinaryResult.bytes,
          url: cloudinaryResult.url,
          version: 1,
          isActive: true,
          uploadedBy: "EMPLOYEE",
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (error) {
      await deleteDocumentFromCloudinary(cloudinaryResult.url).catch(() => undefined);

      // Race: another request may have created the active doc
      const racedDoc = await prisma.employeeDocument.findFirst({
        where: { employeeId: employee.id, documentType, isActive: true },
      });

      if (racedDoc) {
        const oldUrl = racedDoc.url;
        doc = await prisma.employeeDocument.update({
          where: { id: racedDoc.id },
          data: {
            fileName: file.name,
            mimeType,
            sizeBytes: cloudinaryResult.bytes,
            url: cloudinaryResult.url,
            version: racedDoc.version + 1,
            uploadedBy: "EMPLOYEE",
            updatedAt: new Date(),
          },
        });
        if (oldUrl && oldUrl !== cloudinaryResult.url) {
          deleteDocumentFromCloudinary(oldUrl).catch(() => undefined);
        }
      } else {
        throw error;
      }
    }
  }

  if (previousUrl && previousUrl !== cloudinaryResult.url) {
    deleteDocumentFromCloudinary(previousUrl).catch(() => undefined);
  }

  void prisma.employee
    .update({
      where: { id: employeeId },
      data: { lastSavedAt: new Date(), updatedAt: new Date() },
    })
    .catch(() => undefined);

  return mapDocumentRecord(doc);
}

export async function deleteEmployeeDocument(
  employeeId: string,
  documentId: string
): Promise<void> {
  const doc = await prisma.employeeDocument.findFirst({
    where: { id: documentId, employeeId, isActive: true },
  });

  if (!doc) {
    throw new OnboardingError("Document not found", "NOT_FOUND");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { status: true },
  });
  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }
  if (!EDITABLE_STATUSES.includes(employee.status as EmployeeStatus)) {
    throw new OnboardingError("Application is locked", "LOCKED");
  }

  await prisma.employeeDocument.update({
    where: { id: doc.id },
    data: { isActive: false, updatedAt: new Date() },
  });

  if (doc.url) {
    await deleteDocumentFromCloudinary(doc.url);
  }
}

export async function submitOnboardingApplication(
  employeeId: string,
  options?: { submittedBy?: string }
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }

  const allowedSubmitStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.SUBMITTED,
    EmployeeStatus.L1_REVIEW,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];
  if (!allowedSubmitStatuses.includes(employee.status as EmployeeStatus)) {
    throw new OnboardingError(
      "Application cannot be submitted in current status",
      "LOCKED"
    );
  }

  const draft: EmployeeRow = {
    ...employee,
    completedSteps: completedStepsOf(employee.completedSteps),
  };

  const formData = mapEmployeeToFormData(draft);

  // Ensure declaration fields are usable on edit/resubmit of older records
  const decl = formData.declaration ?? {};
  const hasLiveSig =
    typeof decl.signatureDataUrl === "string" &&
    decl.signatureDataUrl.startsWith("data:image/") &&
    decl.signatureDataUrl.length > 20;

  const docsEarly = await prisma.employeeDocument.findMany({
    where: { employeeId, isActive: true },
  });
  const hasSignatureUpload = docsEarly.some(
    (d) => d.documentType === DocumentType.SIGNATURE
  );

  if (!hasLiveSig && hasSignatureUpload) {
    formData.declaration = {
      ...decl,
      agreed: true,
      policeVerificationAccepted: true,
      place: decl.place?.trim() || "Online",
      signatureDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      signedAt: decl.signedAt || new Date().toISOString(),
    };
    draft.declaration = formData.declaration as JsonObject;
  } else if (!decl.policeVerificationAccepted && decl.agreed) {
    formData.declaration = {
      ...decl,
      policeVerificationAccepted: true,
    };
    draft.declaration = formData.declaration as JsonObject;
  }

  if (!String(formData.personalDetails.dateOfJoining ?? "").trim()) {
    const timeline = String(formData.additionalDetails.joiningTimeline ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(timeline)) {
      formData.personalDetails.dateOfJoining = timeline.slice(0, 10);
      draft.personalDetails = {
        ...asJsonObject(draft.personalDetails),
        dateOfJoining: formData.personalDetails.dateOfJoining,
      };
    }
  }

  for (const step of [1, 2, 3, 4, 5, 7] as const) {
    const schema = STEP_SCHEMAS[step];
    const stepData = getStepDataForValidation(formData, step);
    if (!schema || !stepData) continue;

    const result = schema.safeParse(stepData);
    if (!result.success) {
      const issue = result.error.errors[0];
      const field = issue?.path.length ? issue.path.join(".") : "form";
      throw new OnboardingError(
        `Step ${step} (${field}): ${issue?.message ?? "Validation failed"}`,
        "VALIDATION_ERROR"
      );
    }
  }

  const uploadedTypes = docsEarly.map((d) => d.documentType);

  const formDataFull = formData;
  const requiredDocs = getRequiredDocuments({
    isExServiceman: Boolean(formDataFull.exServiceman?.isExServiceman),
    isGunman: Boolean(formDataFull.gunman?.isGunman),
  }).filter((t) => {
    if (t === DocumentType.SIGNATURE && hasLiveSig) return false;
    return true;
  });
  const missing = requiredDocs.filter((t) => !uploadedTypes.includes(t));

  if (missing.length > 0) {
    throw new OnboardingError(
      `Missing required documents: ${missing.join(", ")}`,
      "MISSING_DOCUMENTS"
    );
  }

  const snapshot = formDataFull as unknown as Record<string, unknown>;
  const previousSnapshot = (draft.submittedSnapshot ?? null) as Record<
    string,
    unknown
  > | null;
  const fromStatusBeforeSubmit = draft.status as EmployeeStatus;
  const isResubmit =
    Boolean(previousSnapshot) ||
    [
      EmployeeStatus.SUBMITTED,
      EmployeeStatus.L1_REVIEW,
      EmployeeStatus.L1_RETURNED,
      EmployeeStatus.L2_RETURNED,
    ].includes(fromStatusBeforeSubmit);

  const pendingFieldChanges =
    isResubmit && previousSnapshot
      ? computeFieldChanges(previousSnapshot, snapshot)
      : [];

  let submittedBy = draft.submittedBy;
  if (options?.submittedBy && !submittedBy) {
    submittedBy = options.submittedBy;
  }
  const submitterId = options?.submittedBy ?? submittedBy ?? undefined;
  let submittedByName = draft.submittedByName;
  let submittedByEmail = draft.submittedByEmail;
  if (submitterId) {
    const submitterSnapshot = await getSubmitterSnapshot(submitterId);
    if (submitterSnapshot.submittedByName) {
      submittedByName = submitterSnapshot.submittedByName;
    }
    if (submitterSnapshot.submittedByEmail) {
      submittedByEmail = submitterSnapshot.submittedByEmail;
    }
  }

  const submittedAt = new Date();
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      personalDetails: asInputJson(draft.personalDetails),
      declaration: asInputJson(draft.declaration),
      submittedSnapshot: asInputJson(snapshot),
      pendingFieldChanges: asInputJson(pendingFieldChanges),
      status: EmployeeStatus.SUBMITTED,
      submittedAt,
      completedSteps: asInputJson(
        Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, i) => i + 1)
      ),
      currentStep: ONBOARDING_TOTAL_STEPS,
      correctionNotes: null,
      rejectionReason: null,
      l1Decision: Prisma.DbNull,
      l2Decision: Prisma.DbNull,
      submittedBy,
      submittedByName,
      submittedByEmail,
      updatedAt: submittedAt,
    },
  });

  const { assignL1OnSubmit } = await import("@/lib/services/approval.service");
  await assignL1OnSubmit(employeeId, {
    performedBy: options?.submittedBy ?? submittedBy ?? undefined,
    isResubmit,
  });
}

export { getDefaultFormData, mapEmployeeToFormData };
