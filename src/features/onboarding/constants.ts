export const ONBOARDING_TOTAL_STEPS = 7;

export const ONBOARDING_STEPS = [
  { id: 1, key: "applicant", label: "For Applicant", shortLabel: "Applicant" },
  { id: 2, key: "references", label: "Reference Details", shortLabel: "References" },
  { id: 3, key: "family", label: "Family Details", shortLabel: "Family" },
  { id: 4, key: "nominee", label: "Nominee Details", shortLabel: "Nominee" },
  { id: 5, key: "additional", label: "Additional Particulars", shortLabel: "Additional" },
  { id: 6, key: "attachments", label: "Document Upload", shortLabel: "Documents" },
  { id: 7, key: "declaration", label: "Declaration", shortLabel: "Declaration" },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

export enum DocumentType {
  PHOTO = "PHOTO",
  AADHAAR_FRONT = "AADHAAR_FRONT",
  AADHAAR_BACK = "AADHAAR_BACK",
  PAN = "PAN",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  TRAINING_CERTIFICATE = "TRAINING_CERTIFICATE",
  SIGNATURE = "SIGNATURE",
  BANK_PASSBOOK = "BANK_PASSBOOK",
  EDUCATION_CERTIFICATE = "EDUCATION_CERTIFICATE",
  EXPERIENCE_CERTIFICATE = "EXPERIENCE_CERTIFICATE",
  MEDICAL_CERTIFICATE = "MEDICAL_CERTIFICATE",
  POLICE_VERIFICATION = "POLICE_VERIFICATION",
  DISCHARGE_BOOK = "DISCHARGE_BOOK",
  GUN_LICENSE = "GUN_LICENSE",
  OTHER = "OTHER",
}

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.PHOTO,
  DocumentType.AADHAAR_FRONT,
  DocumentType.AADHAAR_BACK,
  DocumentType.SIGNATURE,
];

export function getRequiredDocuments(options?: {
  isExServiceman?: boolean;
  isGunman?: boolean;
}): DocumentType[] {
  const required = [...REQUIRED_DOCUMENTS];
  if (options?.isExServiceman) required.push(DocumentType.DISCHARGE_BOOK);
  if (options?.isGunman) required.push(DocumentType.GUN_LICENSE);
  return required;
}

export const UPLOAD_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.PHOTO,
  DocumentType.AADHAAR_FRONT,
  DocumentType.AADHAAR_BACK,
  DocumentType.PAN,
  DocumentType.SIGNATURE,
  DocumentType.BANK_PASSBOOK,
  DocumentType.EDUCATION_CERTIFICATE,
  DocumentType.EXPERIENCE_CERTIFICATE,
  DocumentType.DRIVING_LICENSE,
  DocumentType.TRAINING_CERTIFICATE,
  DocumentType.MEDICAL_CERTIFICATE,
  DocumentType.POLICE_VERIFICATION,
  DocumentType.DISCHARGE_BOOK,
  DocumentType.GUN_LICENSE,
  DocumentType.OTHER,
];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  [DocumentType.PHOTO]: "Passport Photo",
  [DocumentType.AADHAAR_FRONT]: "Aadhaar Front",
  [DocumentType.AADHAAR_BACK]: "Aadhaar Back",
  [DocumentType.PAN]: "PAN Card",
  [DocumentType.DRIVING_LICENSE]: "Driving License",
  [DocumentType.TRAINING_CERTIFICATE]: "Training Certificate",
  [DocumentType.SIGNATURE]: "Signature",
  [DocumentType.BANK_PASSBOOK]: "Bank Passbook / Cancelled Cheque",
  [DocumentType.EDUCATION_CERTIFICATE]: "Educational Certificates",
  [DocumentType.EXPERIENCE_CERTIFICATE]: "Experience Certificates",
  [DocumentType.MEDICAL_CERTIFICATE]: "Medical Certificate",
  [DocumentType.POLICE_VERIFICATION]: "Police Verification",
  [DocumentType.DISCHARGE_BOOK]: "Discharge Book (Ex-Serviceman)",
  [DocumentType.GUN_LICENSE]: "Gun License (Gunman)",
  [DocumentType.OTHER]: "Other Documents",
};

export const DOCUMENT_DESCRIPTIONS: Record<DocumentType, string> = {
  [DocumentType.PHOTO]: "Recent passport-size photo with white background",
  [DocumentType.AADHAAR_FRONT]: "Clear copy of Aadhaar front side",
  [DocumentType.AADHAAR_BACK]: "Clear copy of Aadhaar back side",
  [DocumentType.PAN]: "Clear copy of PAN card (optional)",
  [DocumentType.DRIVING_LICENSE]: "Copy of valid driving license (if applicable)",
  [DocumentType.TRAINING_CERTIFICATE]: "Training completion certificate copy",
  [DocumentType.SIGNATURE]: "Signature on white paper (scan or photo)",
  [DocumentType.BANK_PASSBOOK]: "First page showing name, account number, and IFSC (optional)",
  [DocumentType.EDUCATION_CERTIFICATE]: "Education certificates and marksheets",
  [DocumentType.EXPERIENCE_CERTIFICATE]: "Previous employment / experience certificates",
  [DocumentType.MEDICAL_CERTIFICATE]: "Medical fitness certificate",
  [DocumentType.POLICE_VERIFICATION]: "Police verification document",
  [DocumentType.DISCHARGE_BOOK]: "Discharge book copy for ex-servicemen",
  [DocumentType.GUN_LICENSE]: "Valid gun license copy for gunman roles",
  [DocumentType.OTHER]: "Any other supporting document",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const QUALIFICATIONS = [
  "Below 10th", "10th Pass", "12th Pass", "ITI", "Diploma", "Graduate", "Post Graduate", "Other",
];

export const ARMED_FORCES_BRANCHES = ["Army", "Navy", "Air Force"] as const;

export const DECLARATION_TEXT =
  "I hereby declare that the information provided by me is true and correct to the best of my knowledge. I understand that any false statement or suppression of material facts may result in rejection of my application or termination of employment. I authorize Rakshak Securitas Pvt Ltd to verify the information provided and conduct background checks as deemed necessary.";

export const APPLICANT_POLICE_VERIFICATION_DECLARATION =
  "I will submit my Police Verification Certificate within 15 days from the Date of Joining (DOJ). If I fail to submit the Police Verification Certificate within the stipulated period, the company may take suitable action.";

export const DIGITAL_SUBMISSION_NOTICE_TITLE = "Important Information";

export const DIGITAL_SUBMISSION_NOTICE =
  "This Employment Form is submitted electronically through the official Employee Onboarding Portal of Rakshak Securitas Pvt Ltd. The particulars recorded here are exactly as entered by the applicant and, together with the digital signature below, are treated as a valid and binding submission. A separate printed or handwritten form is not required.";

export const EMPLOYMENT_FORM_TITLE = "EMPLOYMENT FORM";
export const EMPLOYMENT_FORM_SUBTITLE = "Rakshak Securitas Pvt Ltd — Employee Onboarding";
