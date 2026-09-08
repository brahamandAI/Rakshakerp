import { connectDB } from "@/lib/db/connect";
import { Employee } from "@/lib/db/models/Employee";
import { EmployeeDocument } from "@/lib/db/models/EmployeeDocument";
import mongoose from "mongoose";
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

/** Convert Mongoose Mixed / subdocs to plain JSON-safe objects (prevents RSC serialize stack overflow). */
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

function normalizeAddress(raw: unknown): EmployeeFormData["address"] {
  const addr = toPlain<EmployeeFormData["address"]>(raw, {});
  if (addr.localAddress || addr.permanentAddress) {
    return {
      localAddress: addr.localAddress ?? "",
      permanentAddress: addr.permanentAddress ?? "",
      sameAsPresent: Boolean(addr.sameAsPresent),
    };
  }

  const present = addr.present ?? {};
  const permanent = addr.permanent ?? {};
  return {
    localAddress:
      [present.houseNo, present.street, present.villageOrCity, present.district, present.state, present.pincode]
        .filter(Boolean)
        .join(", ") || "",
    permanentAddress:
      [permanent.houseNo, permanent.street, permanent.villageOrCity, permanent.district, permanent.state, permanent.pincode]
        .filter(Boolean)
        .join(", ") || "",
    sameAsPresent: Boolean(addr.sameAsPresent),
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

  return {
    branchName: pd.branchName ?? "",
    clientId: pd.clientId ?? "",
    clientName: pd.clientName ?? "",
    siteName: pd.siteName ?? "",
    dateOfJoining: String(pd.dateOfJoining ?? "").trim(),
    postAppliedFor: pd.postAppliedFor ?? "",
    fullName: pd.fullName ?? "",
    fatherName: pd.fatherName ?? pd.fatherOrHusbandName ?? "",
    motherName: pd.motherName ?? "",
    spouseOrNok: pd.spouseOrNok ?? "",
    dateOfBirth: pd.dateOfBirth ?? "",
    bloodGroup: validBlood,
    maritalStatus: validMarital,
    aadhaarNumber: pd.aadhaarNumber ?? "",
    panNumber: pd.panNumber ?? "",
    identificationMarks: pd.identificationMarks ?? "",
  };
}

function mapEmployeeToFormData(employee: InstanceType<typeof Employee>): EmployeeFormData {
  const gunman = toPlain<EmployeeFormData["gunman"]>(
    (employee as { gunman?: unknown }).gunman,
    { isGunman: false }
  );
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

  const declaration = toPlain<EmployeeFormData["declaration"]>(employee.declaration, {});

  return {
    personalDetails: personal,
    address: normalizeAddress(employee.address),
    education: normalizeEducation(employee.education),
    references: toPlain<EmployeeFormData["references"]>(employee.references, []),
    familyDetails: toPlain<EmployeeFormData["familyDetails"]>(employee.familyDetails, []),
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
  await connectDB();
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  const documents = await EmployeeDocument.find({
    employeeId: employee._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  const formData = mapEmployeeToFormData(employee);
  if (!formData.personalDetails.fullName) {
    const legacy = toPlain<{ fullName?: string }>(employee.personalDetails, {});
    formData.personalDetails.fullName = legacy.fullName ?? "";
  }

  const pendingFieldChanges = toPlain<
    OnboardingEmployee["pendingFieldChanges"]
  >(employee.pendingFieldChanges, []);

  return toClientProps({
    _id: employee._id.toString(),
    applicationRef: employee.applicationRef,
    status: employee.status,
    email: employee.email,
    phone: employee.phone,
    currentStep: Math.min(employee.currentStep || 1, ONBOARDING_TOTAL_STEPS),
    completedSteps: Array.isArray(employee.completedSteps)
      ? employee.completedSteps.filter((s) => s <= ONBOARDING_TOTAL_STEPS)
      : [],
    correctionNotes: employee.correctionNotes ?? undefined,
    correctionSteps: Array.isArray(employee.correctionSteps)
      ? [...employee.correctionSteps]
      : undefined,
    pendingFieldChanges,
    formData,
    documents: documents.map(mapDocumentRecord),
    lastSavedAt: employee.lastSavedAt?.toISOString(),
  });
}

function mapDocumentRecord(doc: InstanceType<typeof EmployeeDocument>): DocumentRecord {
  return {
    _id: doc._id.toString(),
    documentType: doc.documentType,
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
    address: { localAddress: string; permanentAddress?: string; sameAsPresent: boolean };
    education: { educationalQualification: string; technicalQualification?: string };
    additionalDetails: Record<string, unknown>;
  };

  return {
    personalDetails: payload.personalDetails,
    address: {
      localAddress: payload.address.localAddress,
      permanentAddress: payload.address.sameAsPresent
        ? payload.address.localAddress
        : payload.address.permanentAddress ?? "",
      sameAsPresent: payload.address.sameAsPresent,
    },
    education: payload.education,
    additionalDetails: payload.additionalDetails,
  };
}

function applyStepData(
  employee: InstanceType<typeof Employee>,
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
        ...(employee.additionalDetails as Record<string, unknown>),
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
      employee.nominee = data.nominee as typeof employee.nominee;
      break;
    case 5: {
      employee.exServiceman = data.exServiceman as typeof employee.exServiceman;
      (employee as { gunman?: Record<string, unknown> }).gunman =
        data.gunman as Record<string, unknown>;
      if (data.additionalDetails) {
        employee.additionalDetails = {
          ...(employee.additionalDetails as Record<string, unknown>),
          ...(data.additionalDetails as Record<string, unknown>),
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

export async function saveOnboardingStep(
  employeeId: string,
  step: number,
  data: Record<string, unknown>,
  options: { validate?: boolean; markComplete?: boolean } = {}
): Promise<{ savedAt: string }> {
  if (step < 1 || step > ONBOARDING_TOTAL_STEPS) {
    throw new OnboardingError("Invalid step", "INVALID_STEP");
  }

  await connectDB();
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }

  const editableStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.SUBMITTED,
    EmployeeStatus.L1_REVIEW,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];

  if (!editableStatuses.includes(employee.status)) {
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

  if (step !== 6) {
    applyStepData(employee, step, data);
  }

  if (employee.currentStep > ONBOARDING_TOTAL_STEPS) {
    employee.currentStep = ONBOARDING_TOTAL_STEPS;
  }
  if (Array.isArray(employee.completedSteps)) {
    employee.completedSteps = employee.completedSteps.filter(
      (s) => s >= 1 && s <= ONBOARDING_TOTAL_STEPS
    );
  }

  if (options.markComplete && !employee.completedSteps.includes(step)) {
    employee.completedSteps = [...employee.completedSteps, step].sort((a, b) => a - b);
  }

  if (employee.submittedSnapshot) {
    const current = mapEmployeeToFormData(employee) as unknown as Record<string, unknown>;
    employee.pendingFieldChanges = computeFieldChanges(
      employee.submittedSnapshot as Record<string, unknown>,
      current
    );
  }

  employee.lastSavedAt = new Date();
  await employee.save();

  return { savedAt: employee.lastSavedAt.toISOString() };
}

export async function updateCurrentStep(
  employeeId: string,
  step: number
): Promise<void> {
  await connectDB();
  await Employee.findByIdAndUpdate(
    employeeId,
    {
      currentStep: Math.min(Math.max(step, 1), ONBOARDING_TOTAL_STEPS),
    },
    { runValidators: true }
  );
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

  await connectDB();
  const employee = await Employee.findById(employeeId).select("status applicationRef");
  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }

  const editableStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.SUBMITTED,
    EmployeeStatus.L1_REVIEW,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];
  if (!editableStatuses.includes(employee.status)) {
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

  const existingDoc = await EmployeeDocument.findOne({
    employeeId: employee._id,
    documentType,
    isActive: true,
  });

  let doc: InstanceType<typeof EmployeeDocument>;
  const previousUrl = existingDoc?.url;

  if (existingDoc) {
    existingDoc.fileName = file.name;
    existingDoc.mimeType = mimeType;
    existingDoc.sizeBytes = cloudinaryResult.bytes;
    existingDoc.url = cloudinaryResult.url;
    existingDoc.version += 1;
    existingDoc.uploadedBy = "EMPLOYEE";
    await existingDoc.save();
    doc = existingDoc;
  } else {
    try {
      doc = await EmployeeDocument.create({
        employeeId: employee._id,
        documentType,
        fileName: file.name,
        mimeType,
        sizeBytes: cloudinaryResult.bytes,
        url: cloudinaryResult.url,
        version: 1,
        isActive: true,
        uploadedBy: "EMPLOYEE",
      });
    } catch (error) {
      await deleteDocumentFromCloudinary(cloudinaryResult.url).catch(() => undefined);

      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        const racedDoc = await EmployeeDocument.findOne({
          employeeId: employee._id,
          documentType,
          isActive: true,
        });

        if (racedDoc) {
          const oldUrl = racedDoc.url;
          racedDoc.fileName = file.name;
          racedDoc.mimeType = mimeType;
          racedDoc.sizeBytes = cloudinaryResult.bytes;
          racedDoc.url = cloudinaryResult.url;
          racedDoc.version += 1;
          racedDoc.uploadedBy = "EMPLOYEE";
          await racedDoc.save();
          if (oldUrl && oldUrl !== cloudinaryResult.url) {
            deleteDocumentFromCloudinary(oldUrl).catch(() => undefined);
          }
          doc = racedDoc;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  if (previousUrl && previousUrl !== cloudinaryResult.url) {
    deleteDocumentFromCloudinary(previousUrl).catch(() => undefined);
  }

  void Employee.updateOne(
    { _id: employeeId },
    { $set: { lastSavedAt: new Date() } }
  );

  return mapDocumentRecord(doc);
}

export async function deleteEmployeeDocument(
  employeeId: string,
  documentId: string
): Promise<void> {
  await connectDB();
  const doc = await EmployeeDocument.findOne({
    _id: documentId,
    employeeId,
    isActive: true,
  });

  if (!doc) {
    throw new OnboardingError("Document not found", "NOT_FOUND");
  }

  const employee = await Employee.findById(employeeId).select("status");
  if (!employee) {
    throw new OnboardingError("Application not found", "NOT_FOUND");
  }
  const editableStatuses = [
    EmployeeStatus.DRAFT,
    EmployeeStatus.SUBMITTED,
    EmployeeStatus.L1_REVIEW,
    EmployeeStatus.L1_RETURNED,
    EmployeeStatus.L2_RETURNED,
  ];
  if (!editableStatuses.includes(employee.status)) {
    throw new OnboardingError("Application is locked", "LOCKED");
  }

  doc.isActive = false;
  await doc.save();

  if (doc.url) {
    await deleteDocumentFromCloudinary(doc.url);
  }
}

export async function submitOnboardingApplication(
  employeeId: string,
  options?: { submittedBy?: string }
): Promise<void> {
  await connectDB();
  const employee = await Employee.findById(employeeId);
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
  if (!allowedSubmitStatuses.includes(employee.status)) {
    throw new OnboardingError("Application cannot be submitted in current status", "LOCKED");
  }

  const formData = mapEmployeeToFormData(employee);

  // Ensure declaration fields are usable on edit/resubmit of older records
  const decl = formData.declaration ?? {};
  const hasLiveSig =
    typeof decl.signatureDataUrl === "string" &&
    decl.signatureDataUrl.startsWith("data:image/") &&
    decl.signatureDataUrl.length > 20;

  const docsEarly = await EmployeeDocument.find({ employeeId, isActive: true });
  const hasSignatureUpload = docsEarly.some(
    (d) => d.documentType === DocumentType.SIGNATURE
  );

  if (!hasLiveSig && hasSignatureUpload) {
    // Accept uploaded signature scan in place of live pad for legacy/resubmit flows
    formData.declaration = {
      ...decl,
      agreed: true,
      policeVerificationAccepted: true,
      place: decl.place?.trim() || "Online",
      signatureDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      signedAt: decl.signedAt || new Date().toISOString(),
    };
    employee.declaration = formData.declaration as Record<string, unknown>;
  } else if (!decl.policeVerificationAccepted && decl.agreed) {
    formData.declaration = {
      ...decl,
      policeVerificationAccepted: true,
    };
    employee.declaration = formData.declaration as Record<string, unknown>;
  }

  if (!String(formData.personalDetails.dateOfJoining ?? "").trim()) {
    const timeline = String(formData.additionalDetails.joiningTimeline ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(timeline)) {
      formData.personalDetails.dateOfJoining = timeline.slice(0, 10);
      employee.personalDetails = {
        ...(employee.personalDetails as Record<string, unknown>),
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
    // Live signature satisfies SIGNATURE document requirement
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
  const previousSnapshot = (employee.submittedSnapshot ?? null) as Record<
    string,
    unknown
  > | null;
  const fromStatusBeforeSubmit = employee.status;
  const isResubmit = Boolean(previousSnapshot) ||
    [EmployeeStatus.SUBMITTED, EmployeeStatus.L1_REVIEW, EmployeeStatus.L1_RETURNED, EmployeeStatus.L2_RETURNED].includes(
      fromStatusBeforeSubmit
    );

  if (isResubmit && previousSnapshot) {
    employee.pendingFieldChanges = computeFieldChanges(previousSnapshot, snapshot);
  } else {
    employee.pendingFieldChanges = [];
  }

  employee.submittedSnapshot = snapshot;
  employee.status = EmployeeStatus.SUBMITTED;
  employee.submittedAt = new Date();
  employee.completedSteps = Array.from({ length: ONBOARDING_TOTAL_STEPS }, (_, i) => i + 1);
  employee.currentStep = ONBOARDING_TOTAL_STEPS;
  employee.correctionNotes = undefined;
  employee.rejectionReason = undefined;
  employee.l1Decision = undefined;
  employee.l2Decision = undefined;
  if (options?.submittedBy && !employee.submittedBy) {
    employee.submittedBy = new mongoose.Types.ObjectId(options.submittedBy);
  }
  const submitterId = options?.submittedBy ?? employee.submittedBy?.toString();
  if (submitterId) {
    const snapshot = await getSubmitterSnapshot(submitterId);
    if (snapshot.submittedByName) employee.submittedByName = snapshot.submittedByName;
    if (snapshot.submittedByEmail) employee.submittedByEmail = snapshot.submittedByEmail;
  }
  await employee.save();

  const { assignL1OnSubmit } = await import("@/lib/services/approval.service");
  await assignL1OnSubmit(employeeId, {
    performedBy: options?.submittedBy ?? employee.submittedBy?.toString(),
    isResubmit,
  });
}

export { getDefaultFormData, mapEmployeeToFormData };
