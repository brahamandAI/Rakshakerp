"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  applicantFormSchema,
  ApplicantFormInput,
} from "@/features/onboarding/schemas/onboarding.schema";
import { BLOOD_GROUPS, QUALIFICATIONS } from "@/features/onboarding/constants";
import {
  BANK_SELECT_OPTIONS,
  DESIGNATION_SELECT_OPTIONS,
  findBankByCode,
  findBankByName,
  findDesignationByCode,
  findDesignationByName,
} from "@/features/onboarding/masters/payroll-codes";
import { useAutoSave } from "@/features/onboarding/components/AutoSaveIndicator";
import { FormSection } from "@/features/onboarding/components/FormSection";
import { EmployeeFormData } from "@/features/onboarding/types";
import { z } from "zod";
import { applySchema } from "@/features/registration/schemas/apply.schema";

interface StepProps {
  defaultValues: EmployeeFormData;
  email: string;
  phone: string;
  formId: string;
  registrationMode?: boolean;
  onContactChange?: (field: "email" | "phone", value: string) => void;
  onSubmit: (data: ApplicantFormInput) => void;
  onAutoSave: (data: ApplicantFormInput) => void;
}

function formatAadhaarInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  const parts = digits.match(/.{1,4}/g) ?? [];
  return parts.join(" ");
}

function emptyAddressPart() {
  return {
    landmark: "",
    village: "",
    postOffice: "",
    taluka: "",
    policeStation: "",
    state: "",
    district: "",
    pincode: "",
    dateSinceResiding: "",
    periodOfStay: "",
    phone: "",
  };
}

function buildDefaults(formData: EmployeeFormData): ApplicantFormInput {
  const pd = formData.personalDetails;
  const addr = formData.address;
  const edu = formData.education;
  const add = formData.additionalDetails;

  const present = {
    ...emptyAddressPart(),
    ...(addr.present ?? {}),
    village: addr.present?.village ?? addr.present?.villageOrCity ?? "",
  };
  const permanent = {
    ...emptyAddressPart(),
    ...(addr.permanent ?? {}),
    village: addr.permanent?.village ?? addr.permanent?.villageOrCity ?? "",
  };

  const localAddress =
    addr.localAddress ??
    [
      present.landmark,
      present.village,
      present.district,
      present.state,
      present.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const permanentAddress =
    addr.permanentAddress ??
    [
      permanent.landmark,
      permanent.village,
      permanent.district,
      permanent.state,
      permanent.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const legacyEdu = edu.entries?.[0];
  const genderRaw = String(pd.gender ?? "").trim().toUpperCase();
  const gender =
    genderRaw === "M" || genderRaw === "F" || genderRaw === "O"
      ? genderRaw
      : genderRaw === "MALE"
        ? "M"
        : genderRaw === "FEMALE"
          ? "F"
          : "";

  return {
    personalDetails: {
      branchName: pd.branchName ?? "",
      clientId: pd.clientId ?? "",
      clientName: pd.clientName ?? "",
      siteName: pd.siteName ?? "",
      dateOfJoining: pd.dateOfJoining ?? "",
      dateOfLeaving: pd.dateOfLeaving ?? "",
      postAppliedFor: pd.postAppliedFor ?? "",
      designationCode:
        pd.designationCode ||
        findDesignationByName(pd.postAppliedFor ?? "")?.code ||
        "",
      department: pd.department ?? "",
      division: pd.division ?? "",
      employeeType: pd.employeeType ?? "G",
      oldEmpId: pd.oldEmpId ?? "",
      fullName: pd.fullName ?? "",
      fatherName: pd.fatherName ?? pd.fatherOrHusbandName ?? "",
      motherName: pd.motherName ?? "",
      spouseOrNok: pd.spouseOrNok ?? "",
      dateOfBirth: pd.dateOfBirth ?? "",
      gender,
      maritalStatus: (["SINGLE", "MARRIED", "WIDOWED"].includes(String(pd.maritalStatus))
        ? pd.maritalStatus
        : "SINGLE") as ApplicantFormInput["personalDetails"]["maritalStatus"],
      bloodGroup: (BLOOD_GROUPS.includes(pd.bloodGroup as (typeof BLOOD_GROUPS)[number])
        ? pd.bloodGroup
        : "") as ApplicantFormInput["personalDetails"]["bloodGroup"],
      aadhaarNumber: formatAadhaarInput(pd.aadhaarNumber ?? ""),
      panNumber: pd.panNumber ?? "",
      identificationMarks: pd.identificationMarks ?? "",
    },
    address: {
      localAddress,
      permanentAddress,
      sameAsPresent: addr.sameAsPresent ?? false,
      present,
      permanent,
    },
    education: {
      educationalQualification:
        edu.educationalQualification ??
        legacyEdu?.qualification ??
        "",
      technicalQualification:
        edu.technicalQualification ??
        legacyEdu?.institution ??
        "",
    },
    additionalDetails: {
      height: add.height ?? "",
      weight: add.weight ?? "",
      eyeSight: add.eyeSight ?? "",
      eyeColor: add.eyeColor ?? "",
      hearing: add.hearing ?? "",
      willingToWorkAnywhere: add.willingToWorkAnywhere ?? false,
      joiningTimeline: add.joiningTimeline ?? add.expectedDateOfJoining ?? "",
      previousEmployer: add.previousEmployer ?? "",
      uanNo: add.uanNo ?? "",
      esicNumber: add.esicNumber ?? "",
      esiApplicable: (add.esiApplicable === "YES" || add.esiApplicable === "NO"
        ? add.esiApplicable
        : "") as ApplicantFormInput["additionalDetails"]["esiApplicable"],
      pfApplicable: (add.pfApplicable === "YES" || add.pfApplicable === "NO"
        ? add.pfApplicable
        : "") as ApplicantFormInput["additionalDetails"]["pfApplicable"],
      ptApplicable: (add.ptApplicable === "YES" || add.ptApplicable === "NO"
        ? add.ptApplicable
        : "") as ApplicantFormInput["additionalDetails"]["ptApplicable"],
      bankName: add.bankName ?? "",
      bankCode:
        add.bankCode || findBankByName(add.bankName ?? "")?.code || "",
      bankBranchName: add.bankBranchName ?? "",
      accountHolderName: add.accountHolderName ?? "",
      accountNumber: add.accountNumber ?? "",
      ifscCode: add.ifscCode ?? "",
    },
  };
}

export function ApplicantFormStep({
  defaultValues,
  email,
  phone,
  registrationMode = false,
  onContactChange,
  formId,
  onSubmit,
  onAutoSave,
}: StepProps) {
  const [contactErrors, setContactErrors] = useState<{ email?: string; phone?: string }>({});
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplicantFormInput>({
    resolver: zodResolver(applicantFormSchema),
    defaultValues: buildDefaults(defaultValues),
  });

  useAutoSave(watch(), onAutoSave);
  const sameAsPresent = watch("address.sameAsPresent");
  const selectedDesignation = watch("personalDetails.postAppliedFor");
  const selectedBank = watch("additionalDetails.bankName");

  const designationOptions = DESIGNATION_SELECT_OPTIONS.some(
    (o) => o.value === selectedDesignation
  )
    ? DESIGNATION_SELECT_OPTIONS
    : selectedDesignation
      ? [
          ...DESIGNATION_SELECT_OPTIONS,
          { value: selectedDesignation, label: selectedDesignation },
        ]
      : DESIGNATION_SELECT_OPTIONS;

  const bankOptions = BANK_SELECT_OPTIONS.some((o) => o.value === selectedBank)
    ? BANK_SELECT_OPTIONS
    : selectedBank
      ? [...BANK_SELECT_OPTIONS, { value: selectedBank, label: selectedBank }]
      : BANK_SELECT_OPTIONS;

  function submitStep(data: ApplicantFormInput) {
    const designation =
      findDesignationByName(data.personalDetails.postAppliedFor) ??
      findDesignationByCode(data.personalDetails.designationCode ?? "");
    if (designation) {
      data.personalDetails.postAppliedFor = designation.name;
      data.personalDetails.designationCode = designation.code;
    }

    const bank =
      findBankByName(data.additionalDetails.bankName) ??
      findBankByCode(data.additionalDetails.bankCode ?? "");
    if (bank) {
      data.additionalDetails.bankName = bank.name;
      data.additionalDetails.bankCode = bank.code;
    }

    if (registrationMode) {
      const parsed = applySchema
        .extend({
          email: z.string().email("Enter a valid email").or(z.literal("")),
        })
        .safeParse({
          fullName: data.personalDetails.fullName,
          email,
          phone,
        });
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setContactErrors({
          email: fieldErrors.email?.[0],
          phone: fieldErrors.phone?.[0],
        });
        return;
      }
    }
    setContactErrors({});
    onSubmit(data);
  }

  return (
    <form id={formId} onSubmit={handleSubmit(submitStep)} className="space-y-6">
      <FormSection
        sectionNumber={1}
        title="For Applicant"
        subtitle="Please fill all fields marked with * accurately."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label required>Branch Name</Label>
            <Input {...register("personalDetails.branchName")} error={errors.personalDetails?.branchName?.message} />
          </div>
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input {...register("personalDetails.clientId")} error={errors.personalDetails?.clientId?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Date of Joining</Label>
            <Input
              type="date"
              {...register("personalDetails.dateOfJoining")}
              error={errors.personalDetails?.dateOfJoining?.message}
            />
          </div>
          <div className="space-y-2">
            <Label>Date of Leaving</Label>
            <Input type="date" {...register("personalDetails.dateOfLeaving")} />
          </div>
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input {...register("personalDetails.clientName")} error={errors.personalDetails?.clientName?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Site Name</Label>
            <Input {...register("personalDetails.siteName")} error={errors.personalDetails?.siteName?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Post Applied For / Designation</Label>
            <Select
              {...register("personalDetails.postAppliedFor", {
                onChange: (e) => {
                  const name = e.target.value;
                  const match = findDesignationByName(name);
                  setValue("personalDetails.postAppliedFor", name, {
                    shouldValidate: true,
                  });
                  setValue(
                    "personalDetails.designationCode",
                    match?.code ?? "",
                    { shouldValidate: true }
                  );
                },
              })}
              options={designationOptions}
              error={errors.personalDetails?.postAppliedFor?.message}
            />
            <input type="hidden" {...register("personalDetails.designationCode")} />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input {...register("personalDetails.department")} />
          </div>
          <div className="space-y-2">
            <Label>Division</Label>
            <Input {...register("personalDetails.division")} />
          </div>
          <div className="space-y-2">
            <Label>Employee Type</Label>
            <Input {...register("personalDetails.employeeType")} placeholder="G" />
          </div>
          <div className="space-y-2">
            <Label>Old Emp ID</Label>
            <Input {...register("personalDetails.oldEmpId")} placeholder="RSMxxxxxx" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label required>Full Name of Applicant</Label>
            <Input {...register("personalDetails.fullName")} error={errors.personalDetails?.fullName?.message} />
          </div>
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Select
              {...register("personalDetails.bloodGroup")}
              options={[
                { value: "", label: "Select blood group" },
                ...BLOOD_GROUPS.map((b) => ({ value: b, label: b })),
              ]}
              error={errors.personalDetails?.bloodGroup?.message}
            />
          </div>
          <div className="space-y-2">
            <Label required>Contact Number</Label>
            {registrationMode ? (
              <Input
                value={phone}
                onChange={(e) => {
                  setContactErrors((prev) => ({ ...prev, phone: undefined }));
                  onContactChange?.("phone", e.target.value.replace(/\D/g, "").slice(0, 10));
                }}
                maxLength={10}
                placeholder="10-digit mobile number"
                error={contactErrors.phone}
              />
            ) : (
              <Input value={phone} disabled className="bg-[#F8FAFC]" />
            )}
          </div>
          <div className="space-y-2">
            <Label required>Date of Birth</Label>
            <Input type="date" {...register("personalDetails.dateOfBirth")} error={errors.personalDetails?.dateOfBirth?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Sex</Label>
            <Select
              {...register("personalDetails.gender")}
              options={[
                { value: "", label: "Select sex" },
                { value: "M", label: "Male (M)" },
                { value: "F", label: "Female (F)" },
                { value: "O", label: "Other (O)" },
              ]}
              error={errors.personalDetails?.gender?.message}
            />
          </div>
          <div className="space-y-2">
            <Label required>Aadhar No.</Label>
            <Input
              {...register("personalDetails.aadhaarNumber")}
              value={watch("personalDetails.aadhaarNumber") ?? ""}
              onChange={(e) =>
                setValue(
                  "personalDetails.aadhaarNumber",
                  formatAadhaarInput(e.target.value),
                  { shouldValidate: true }
                )
              }
              maxLength={14}
              placeholder="1234 5678 9012"
              error={errors.personalDetails?.aadhaarNumber?.message}
            />
          </div>
          <div className="space-y-2">
            <Label required>Father&apos;s Name</Label>
            <Input {...register("personalDetails.fatherName")} error={errors.personalDetails?.fatherName?.message} />
          </div>
          <div className="space-y-2">
            <Label>Mother&apos;s Name</Label>
            <Input {...register("personalDetails.motherName")} error={errors.personalDetails?.motherName?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Marital Status</Label>
            <Select
              {...register("personalDetails.maritalStatus")}
              options={[
                { value: "SINGLE", label: "Single" },
                { value: "MARRIED", label: "Married" },
                { value: "WIDOWED", label: "Widow" },
              ]}
              error={errors.personalDetails?.maritalStatus?.message}
            />
          </div>
          {watch("personalDetails.maritalStatus") === "MARRIED" && (
            <div className="space-y-2">
              <Label>Spouse Name</Label>
              <Input
                {...register("personalDetails.spouseOrNok")}
                error={errors.personalDetails?.spouseOrNok?.message}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Email</Label>
            {registrationMode ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setContactErrors((prev) => ({ ...prev, email: undefined }));
                  onContactChange?.("email", e.target.value);
                }}
                placeholder="your.email@example.com"
                error={contactErrors.email}
              />
            ) : (
              <Input value={email} disabled className="bg-[#F8FAFC]" />
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label required>Local Address (summary)</Label>
            <Textarea {...register("address.localAddress")} rows={2} error={errors.address?.localAddress?.message} />
          </div>
          <div className="sm:col-span-2 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A]">Present Address Details</h4>
              <p className="mt-0.5 text-xs text-[#64748B]">Optional — used in payroll Excel export.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Present Landmark</Label><Input {...register("address.present.landmark")} /></div>
              <div className="space-y-2"><Label>Present Village</Label><Input {...register("address.present.village")} /></div>
              <div className="space-y-2"><Label>Present Post Office</Label><Input {...register("address.present.postOffice")} /></div>
              <div className="space-y-2"><Label>Present Taluka</Label><Input {...register("address.present.taluka")} /></div>
              <div className="space-y-2"><Label>Present Police Station</Label><Input {...register("address.present.policeStation")} /></div>
              <div className="space-y-2"><Label>Present State</Label><Input {...register("address.present.state")} /></div>
              <div className="space-y-2"><Label>Present District</Label><Input {...register("address.present.district")} /></div>
              <div className="space-y-2"><Label>Present Pincode</Label><Input {...register("address.present.pincode")} /></div>
              <div className="space-y-2"><Label>Present Date Since Residing</Label><Input type="date" {...register("address.present.dateSinceResiding")} /></div>
              <div className="space-y-2"><Label>Present Period of Stay</Label><Input {...register("address.present.periodOfStay")} placeholder="e.g. 2 Years" /></div>
              <div className="space-y-2"><Label>Present Phone</Label><Input {...register("address.present.phone")} /></div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Checkbox
              id="sameAsPresent"
              label="Permanent address same as local / present address"
              checked={sameAsPresent}
              onChange={(e) => {
                setValue("address.sameAsPresent", e.target.checked);
                if (e.target.checked) {
                  setValue("address.permanentAddress", watch("address.localAddress"));
                  setValue("address.permanent", watch("address.present"));
                }
              }}
            />
          </div>
          {!sameAsPresent && (
            <>
              <div className="space-y-2 sm:col-span-2">
                <Label required>Permanent Address (summary)</Label>
                <Textarea {...register("address.permanentAddress")} rows={2} error={errors.address?.permanentAddress?.message} />
              </div>
              <div className="sm:col-span-2 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#0F172A]">Permanent Address Details</h4>
                  <p className="mt-0.5 text-xs text-[#64748B]">Optional — used in payroll Excel export.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Permanent Landmark</Label><Input {...register("address.permanent.landmark")} /></div>
                  <div className="space-y-2"><Label>Permanent Village</Label><Input {...register("address.permanent.village")} /></div>
                  <div className="space-y-2"><Label>Permanent Post Office</Label><Input {...register("address.permanent.postOffice")} /></div>
                  <div className="space-y-2"><Label>Permanent Taluka</Label><Input {...register("address.permanent.taluka")} /></div>
                  <div className="space-y-2"><Label>Permanent Police Station</Label><Input {...register("address.permanent.policeStation")} /></div>
                  <div className="space-y-2"><Label>Permanent State</Label><Input {...register("address.permanent.state")} /></div>
                  <div className="space-y-2"><Label>Permanent District</Label><Input {...register("address.permanent.district")} /></div>
                  <div className="space-y-2"><Label>Permanent Pincode</Label><Input {...register("address.permanent.pincode")} /></div>
                  <div className="space-y-2"><Label>Permanent Date Since Residing</Label><Input type="date" {...register("address.permanent.dateSinceResiding")} /></div>
                  <div className="space-y-2"><Label>Permanent Period of Stay</Label><Input {...register("address.permanent.periodOfStay")} placeholder="e.g. 2 Years" /></div>
                  <div className="space-y-2"><Label>Permanent Phone</Label><Input {...register("address.permanent.phone")} /></div>
                </div>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label required>Height (cm)</Label>
            <Input {...register("additionalDetails.height")} placeholder="e.g. 170" error={errors.additionalDetails?.height?.message} />
          </div>
          <div className="space-y-2">
            <Label required>Weight (kg)</Label>
            <Input {...register("additionalDetails.weight")} placeholder="e.g. 65" error={errors.additionalDetails?.weight?.message} />
          </div>
          <div className="space-y-2">
            <Label>Eye Sight</Label>
            <Input {...register("additionalDetails.eyeSight")} placeholder="6/6, Normal, etc." error={errors.additionalDetails?.eyeSight?.message} />
          </div>
          <div className="space-y-2">
            <Label>Color of Eyes</Label>
            <Input {...register("additionalDetails.eyeColor")} error={errors.additionalDetails?.eyeColor?.message} />
          </div>
          <div className="space-y-2">
            <Label>Hearing</Label>
            <Input {...register("additionalDetails.hearing")} placeholder="Normal / Impaired" error={errors.additionalDetails?.hearing?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Identification Marks</Label>
            <Input {...register("personalDetails.identificationMarks")} />
          </div>
          <div className="space-y-2">
            <Label>PAN Card No.</Label>
            <Input
              {...register("personalDetails.panNumber")}
              className="uppercase"
              onChange={(e) =>
                setValue(
                  "personalDetails.panNumber",
                  e.target.value.toUpperCase().replace(/\s/g, ""),
                  { shouldValidate: true }
                )
              }
              error={errors.personalDetails?.panNumber?.message}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Educational Qualification</Label>
            <Select
              {...register("education.educationalQualification")}
              options={[
                { value: "", label: "Select qualification" },
                ...QUALIFICATIONS.map((q) => ({ value: q, label: q })),
              ]}
              error={errors.education?.educationalQualification?.message}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Technical Qualification / Diploma</Label>
            <Input {...register("education.technicalQualification")} placeholder="ITI, Diploma, etc." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Checkbox
              id="willingAnywhere"
              label="Are you willing to work anywhere in India?"
              checked={watch("additionalDetails.willingToWorkAnywhere")}
              onChange={(e) => setValue("additionalDetails.willingToWorkAnywhere", e.target.checked)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>How soon you can join duties with us?</Label>
            <Input {...register("additionalDetails.joiningTimeline")} placeholder="Immediately / 15 days / 1 month" error={errors.additionalDetails?.joiningTimeline?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Previous Employer Name</Label>
            <Input {...register("additionalDetails.previousEmployer")} />
          </div>
          <div className="space-y-2">
            <Label>UAN No</Label>
            <Input {...register("additionalDetails.uanNo")} error={errors.additionalDetails?.uanNo?.message} />
            <p className="text-xs text-[#64748B]">
              Don&apos;t have UAN? Generate a new UAN using:{" "}
              <a
                href="https://web.umang.gov.in/uaw/i/v/ref"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                https://web.umang.gov.in/uaw/i/v/ref
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label>ESI Applicable</Label>
            <Select
              {...register("additionalDetails.esiApplicable")}
              options={[
                { value: "", label: "Select" },
                { value: "YES", label: "YES" },
                { value: "NO", label: "NO" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>ESI / ESIC Number</Label>
            <Input {...register("additionalDetails.esicNumber")} error={errors.additionalDetails?.esicNumber?.message} />
          </div>
          <div className="space-y-2">
            <Label>PF Applicable</Label>
            <Select
              {...register("additionalDetails.pfApplicable")}
              options={[
                { value: "", label: "Select" },
                { value: "YES", label: "YES" },
                { value: "NO", label: "NO" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>PT Applicable</Label>
            <Select
              {...register("additionalDetails.ptApplicable")}
              options={[
                { value: "", label: "Select" },
                { value: "YES", label: "YES" },
                { value: "NO", label: "NO" },
              ]}
            />
          </div>
          <div className="sm:col-span-2 space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div>
              <h4 className="text-sm font-semibold text-[#0F172A]">Bank Details</h4>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Required for payroll — select bank name from the list.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label required>Bank Name</Label>
                <Select
                  {...register("additionalDetails.bankName", {
                    onChange: (e) => {
                      const name = e.target.value;
                      const match = findBankByName(name);
                      setValue("additionalDetails.bankName", name, {
                        shouldValidate: true,
                      });
                      setValue("additionalDetails.bankCode", match?.code ?? "", {
                        shouldValidate: true,
                      });
                    },
                  })}
                  options={bankOptions}
                  error={errors.additionalDetails?.bankName?.message}
                />
                <input type="hidden" {...register("additionalDetails.bankCode")} />
              </div>
              <div className="space-y-2">
                <Label required>Branch Name</Label>
                <Input
                  {...register("additionalDetails.bankBranchName")}
                  error={errors.additionalDetails?.bankBranchName?.message}
                />
              </div>
              <div className="space-y-2">
                <Label required>Account Holder Name</Label>
                <Input
                  {...register("additionalDetails.accountHolderName")}
                  error={errors.additionalDetails?.accountHolderName?.message}
                />
              </div>
              <div className="space-y-2">
                <Label required>Account Number</Label>
                <Input
                  {...register("additionalDetails.accountNumber")}
                  error={errors.additionalDetails?.accountNumber?.message}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label required>IFSC Code</Label>
                <Input
                  {...register("additionalDetails.ifscCode")}
                  className="uppercase"
                  onChange={(e) =>
                    setValue(
                      "additionalDetails.ifscCode",
                      e.target.value.toUpperCase().replace(/\s/g, ""),
                      { shouldValidate: true }
                    )
                  }
                  error={errors.additionalDetails?.ifscCode?.message}
                />
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </form>
  );
}
