import { z } from "zod";
import { BLOOD_GROUPS, ARMED_FORCES_BRANCHES } from "@/features/onboarding/constants";

const phoneRegex = /^[6-9]\d{9}$/;
const aadhaarRegex = /^\d{4}\s\d{4}\s\d{4}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const optionalYesNo = z.enum(["YES", "NO", ""]).optional();

const structuredAddressPartSchema = z.object({
  landmark: z.string().optional(),
  village: z.string().optional(),
  postOffice: z.string().optional(),
  taluka: z.string().optional(),
  policeStation: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  pincode: z.string().optional(),
  dateSinceResiding: z.string().optional(),
  periodOfStay: z.string().optional(),
  phone: z.string().optional(),
});

export const personalDetailsSchema = z
  .object({
    branchName: z.string().min(1, "Branch name is required"),
    clientId: z.string().optional(),
    clientName: z.string().optional(),
    siteName: z.string().min(1, "Site name is required"),
    dateOfJoining: z.string().min(1, "Date of joining is required"),
    dateOfLeaving: z.string().optional(),
    postAppliedFor: z.string().min(1, "Post applied for is required"),
    designationCode: z.string().optional(),
    department: z.string().optional(),
    division: z.string().optional(),
    employeeType: z.string().optional(),
    oldEmpId: z.string().optional(),
    fullName: z.string().min(2, "Full name is required").max(100),
    fatherName: z.string().min(2, "Father's name is required"),
    motherName: z.string().optional(),
    spouseOrNok: z.string().optional(),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.union([
      z.literal("M"),
      z.literal("F"),
      z.literal("O"),
      z.literal(""),
    ]),
    maritalStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED"], {
      required_error: "Marital status is required",
    }),
    bloodGroup: z
      .enum([...BLOOD_GROUPS] as [string, ...string[]])
      .or(z.literal(""))
      .optional(),
    aadhaarNumber: z.string().regex(aadhaarRegex, "Enter Aadhaar as XXXX XXXX XXXX"),
    panNumber: z
      .string()
      .regex(panRegex, "Enter valid PAN (e.g. ABCDE1234F)")
      .or(z.literal(""))
      .optional()
      .transform((v) => v || undefined),
    identificationMarks: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!(data.gender === "M" || data.gender === "F" || data.gender === "O")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sex is required",
        path: ["gender"],
      });
    }
    if (data.maritalStatus === "MARRIED" && !data.spouseOrNok?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Spouse name is required when marital status is Married",
        path: ["spouseOrNok"],
      });
    }
  });

export const addressSchema = z
  .object({
    localAddress: z.string().min(5, "Local address is required"),
    permanentAddress: z.string().optional(),
    sameAsPresent: z.boolean(),
    present: structuredAddressPartSchema.optional(),
    permanent: structuredAddressPartSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.sameAsPresent && !data.permanentAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Permanent address is required",
        path: ["permanentAddress"],
      });
    }
  });

export const educationSchema = z.object({
  education: z.object({
    educationalQualification: z.string().optional(),
    technicalQualification: z.string().optional(),
  }),
});

export const physicalDetailsSchema = z.object({
  additionalDetails: z.object({
    height: z.string().min(1, "Height is required"),
    weight: z.string().min(1, "Weight is required"),
    eyeSight: z.string().optional(),
    eyeColor: z.string().optional(),
    hearing: z.string().optional(),
  }),
});

export const employmentPreferencesSchema = z.object({
  additionalDetails: z.object({
    willingToWorkAnywhere: z.boolean(),
    joiningTimeline: z.string().optional(),
    previousEmployer: z.string().optional(),
    uanNo: z.string().optional(),
    esicNumber: z.string().optional(),
    esiApplicable: optionalYesNo,
    pfApplicable: optionalYesNo,
    pfNumber: z.string().optional(),
    ptApplicable: optionalYesNo,
    bankName: z.string().optional(),
    bankBranchName: z.string().optional(),
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z
      .string()
      .regex(ifscRegex, "Enter valid IFSC code")
      .or(z.literal(""))
      .optional(),
  }),
});

export const applicantFormSchema = z.object({
  personalDetails: personalDetailsSchema,
  address: addressSchema,
  education: educationSchema.shape.education,
  additionalDetails: physicalDetailsSchema.shape.additionalDetails
    .merge(employmentPreferencesSchema.shape.additionalDetails),
});

export const referenceEntrySchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z.string().regex(phoneRegex, "Enter valid 10-digit contact number"),
  address: z.string().min(5, "Address is required"),
});

export const referencesSchema = z.object({
  references: z.array(referenceEntrySchema).length(2, "Two references are required"),
});

export const familyMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  aadhaarNumber: z.string().regex(aadhaarRegex, "Enter Aadhaar as XXXX XXXX XXXX"),
});

export const familyDetailsSchema = z.object({
  familyDetails: z.array(familyMemberSchema).min(1, "Add at least one family member"),
});

export const referencesFamilySchema = referencesSchema.merge(familyDetailsSchema);

export const nomineeSchema = z.object({
  nominee: z.object({
    name: z.string().min(2, "Nominee name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    aadhaarNumber: z.string().regex(aadhaarRegex, "Enter Aadhaar as XXXX XXXX XXXX"),
  }),
});

export const exServicemanSchema = z
  .object({
    exServiceman: z.object({
      isExServiceman: z.boolean(),
      armedForcesBranch: z.string().optional(),
      rank: z.string().optional(),
      serviceNumber: z.string().optional(),
      dateOfDischarge: z.string().optional(),
      unitLastServed: z.string().optional(),
      dischargeBook: z.string().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.exServiceman.isExServiceman) return;
    const fields = [
      ["armedForcesBranch", "Armed forces branch is required"],
      ["rank", "Rank is required"],
      ["serviceNumber", "Service number is required"],
      ["dateOfDischarge", "Date of discharge is required"],
      ["unitLastServed", "Unit last served is required"],
    ] as const;
    for (const [field, message] of fields) {
      if (!data.exServiceman[field]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: ["exServiceman", field],
        });
      }
    }
  });

export const gunmanSchema = z
  .object({
    gunman: z.object({
      isGunman: z.boolean(),
      gunNumber: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseValidUpto: z.string().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.gunman.isGunman) return;
    if (!data.gunman.gunNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gun number is required", path: ["gunman", "gunNumber"] });
    }
    if (!data.gunman.licenseNumber?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "License number is required", path: ["gunman", "licenseNumber"] });
    }
    if (!data.gunman.licenseValidUpto?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "License validity date is required", path: ["gunman", "licenseValidUpto"] });
    }
  });

export const additionalParticularsSchema = z
  .object({
    exServiceman: z.object({
      isExServiceman: z.boolean(),
      armedForcesBranch: z.string().optional(),
      rank: z.string().optional(),
      serviceNumber: z.string().optional(),
      dateOfDischarge: z.string().optional(),
      unitLastServed: z.string().optional(),
      dischargeBook: z.string().optional(),
    }),
    gunman: z.object({
      isGunman: z.boolean(),
      gunNumber: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseValidUpto: z.string().optional(),
    }),
    additionalDetails: z.object({
      drivingLicenseNumber: z.string().optional(),
      drivingLicenseValidityDate: z.string().optional(),
      trainingCertificateUpload: z.string().optional(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.exServiceman.isExServiceman) {
      const fields = [
        ["armedForcesBranch", "Armed forces branch is required"],
        ["rank", "Rank is required"],
        ["serviceNumber", "Service number is required"],
        ["dateOfDischarge", "Date of discharge is required"],
        ["unitLastServed", "Unit last served is required"],
      ] as const;
      for (const [field, message] of fields) {
        if (!data.exServiceman[field]?.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["exServiceman", field] });
        }
      }
    }
    if (data.gunman.isGunman) {
      if (!data.gunman.gunNumber?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gun number is required", path: ["gunman", "gunNumber"] });
      }
      if (!data.gunman.licenseNumber?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "License number is required", path: ["gunman", "licenseNumber"] });
      }
      if (!data.gunman.licenseValidUpto?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "License validity date is required", path: ["gunman", "licenseValidUpto"] });
      }
    }
  });

export const declarationSchema = z.object({
  declaration: z.object({
    agreed: z
      .boolean({ required_error: "You must accept the declaration" })
      .refine((v) => v === true, { message: "You must accept the declaration" }),
    place: z.string().min(2, "Place is required"),
    policeVerificationAccepted: z
      .boolean({ required_error: "Please accept Police Verification declaration" })
      .refine((v) => v === true, { message: "Please accept Police Verification declaration" }),
    signatureDataUrl: z
      .string()
      .min(20, "Please provide your live signature")
      .refine((v) => v.startsWith("data:image/"), {
        message: "Please provide your live signature",
      }),
    signedAt: z.string().optional(),
  }),
});

export const STEP_SCHEMAS = {
  1: applicantFormSchema,
  2: referencesSchema,
  3: familyDetailsSchema,
  4: nomineeSchema,
  5: additionalParticularsSchema,
  7: declarationSchema,
} as const;

export type ReferencesInput = z.infer<typeof referencesSchema>;
export type FamilyDetailsInput = z.infer<typeof familyDetailsSchema>;
export type NomineeInput = z.infer<typeof nomineeSchema>;
export type AdditionalParticularsInput = z.infer<typeof additionalParticularsSchema>;
export type ApplicantFormInput = z.infer<typeof applicantFormSchema>;
export type ReferencesFamilyInput = z.infer<typeof referencesFamilySchema>;
export type NomineeAdditionalInput = z.infer<typeof additionalParticularsSchema>;
export type DeclarationInput = z.infer<typeof declarationSchema>;
