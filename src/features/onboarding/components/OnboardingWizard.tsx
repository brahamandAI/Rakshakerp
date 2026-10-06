"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoSaveIndicator } from "@/features/onboarding/components/AutoSaveIndicator";
import { FormStepNav } from "@/features/onboarding/components/FormStepNav";
import { ApplicantFormStep } from "@/features/onboarding/components/steps/ApplicantFormStep";
import { ReferencesStep } from "@/features/onboarding/components/steps/ReferencesStep";
import { FamilyStep } from "@/features/onboarding/components/steps/FamilyStep";
import { NomineeStep } from "@/features/onboarding/components/steps/NomineeStep";
import { AdditionalStep } from "@/features/onboarding/components/steps/AdditionalStep";
import { DeclarationStep } from "@/features/onboarding/components/steps/DeclarationStep";
import { DocumentsStep } from "@/features/onboarding/components/steps/DocumentsStep";
import {
  saveStepAction,
  goToStepAction,
  submitApplicationAction,
} from "@/features/onboarding/actions/onboarding.actions";
import { registerAndSaveStep1Action } from "@/features/registration/actions/register.actions";
import {
  ONBOARDING_TOTAL_STEPS,
  DocumentType,
  getRequiredDocuments,
} from "@/features/onboarding/constants";
import { OnboardingEmployee, DocumentRecord } from "@/features/onboarding/types";
import { useToast } from "@/components/ui/toast";
import { RegistrationSubmittedSuccess } from "@/features/onboarding/components/RegistrationSubmittedSuccess";
import { EmployeeStatus } from "@/types/enums";

interface OnboardingWizardProps {
  employee: OnboardingEmployee;
  registrationMode?: boolean;
  submitterMode?: boolean;
  l1EditMode?: boolean;
}

function scrollFormChromeIntoView() {
  requestAnimationFrame(() => {
    document.getElementById("onboarding-form-chrome")?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  });
}

export function OnboardingWizard({
  employee: initialEmployee,
  registrationMode = false,
  submitterMode = false,
  l1EditMode = false,
}: OnboardingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [employee, setEmployee] = useState(initialEmployee);
  const [currentStep, setCurrentStep] = useState(
    Math.min(employee.currentStep || 1, ONBOARDING_TOTAL_STEPS)
  );
  const [completedSteps, setCompletedSteps] = useState(employee.completedSteps);
  const [documents, setDocuments] = useState<DocumentRecord[]>(employee.documents);
  const [lastSavedAt, setLastSavedAt] = useState(employee.lastSavedAt ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactEmail, setContactEmail] = useState(employee.email);
  const [contactPhone, setContactPhone] = useState(employee.phone);

  const employeeRef = useRef(employee);
  employeeRef.current = employee;

  const persistChainRef = useRef(Promise.resolve());
  const persistFailedRef = useRef(false);
  const forceNextPersistRef = useRef(false);
  const advanceLockRef = useRef(false);
  const sessionReadyRef = useRef(
    Promise.resolve(Boolean(initialEmployee.applicationRef) || !registrationMode)
  );
  const sessionReadyResolveRef = useRef<((ok: boolean) => void) | undefined>(
    undefined
  );

  const isNewRegistration = registrationMode && !employee.applicationRef;
  const formId = `step-form-${currentStep}`;
  const { formData } = employee;

  function enqueuePersist(task: () => Promise<void>) {
    persistChainRef.current = persistChainRef.current
      .then(async () => {
        const force = forceNextPersistRef.current;
        forceNextPersistRef.current = false;
        if (persistFailedRef.current && !force) return;
        if (force) persistFailedRef.current = false;
        await task();
      })
      .catch((error) => {
        persistFailedRef.current = true;
        console.error("[onboarding] persist failed", error);
      });
  }

  const ensureApplicationReady = useCallback(async () => {
    if (employeeRef.current.applicationRef) return true;
    if (!registrationMode) return true;

    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (employeeRef.current.applicationRef) return true;

      const pending = sessionReadyRef.current;
      const winner = await Promise.race([
        pending.then(
          (ok) => ({ kind: "session" as const, ok }),
          () => ({ kind: "session" as const, ok: false })
        ),
        new Promise<{ kind: "timeout" }>((resolve) => {
          window.setTimeout(() => resolve({ kind: "timeout" }), 300);
        }),
      ]);

      if (employeeRef.current.applicationRef) return true;

      if (winner.kind === "timeout") continue;

      if (sessionReadyRef.current !== pending) continue;

      await persistChainRef.current.catch(() => undefined);
      if (employeeRef.current.applicationRef) return true;

      if (winner.ok && !persistFailedRef.current) {
        return Boolean(employeeRef.current.applicationRef);
      }
      if (!sessionReadyResolveRef.current) return false;
    }

    return Boolean(employeeRef.current.applicationRef);
  }, [registrationMode]);

  function mergeStepData(step: number, data: Record<string, unknown>) {
    setEmployee((prev) => {
      const nextFormData = { ...prev.formData };

      if (step === 1) {
        if (data.personalDetails) nextFormData.personalDetails = data.personalDetails as typeof nextFormData.personalDetails;
        if (data.address) nextFormData.address = data.address as typeof nextFormData.address;
        if (data.education) nextFormData.education = data.education as typeof nextFormData.education;
        if (data.additionalDetails) {
          nextFormData.additionalDetails = data.additionalDetails as typeof nextFormData.additionalDetails;
        }
      } else if (step === 2 && data.references) {
        nextFormData.references = data.references as typeof nextFormData.references;
      } else if (step === 3 && data.familyDetails) {
        nextFormData.familyDetails = data.familyDetails as typeof nextFormData.familyDetails;
      } else if (step === 4 && data.nominee) {
        nextFormData.nominee = data.nominee as typeof nextFormData.nominee;
      } else if (step === 5) {
        if (data.exServiceman) nextFormData.exServiceman = data.exServiceman as typeof nextFormData.exServiceman;
        if (data.gunman) nextFormData.gunman = data.gunman as typeof nextFormData.gunman;
        if (data.additionalDetails) {
          nextFormData.additionalDetails = {
            ...nextFormData.additionalDetails,
            ...(data.additionalDetails as typeof nextFormData.additionalDetails),
          };
        }
      } else if (step === 7 && data.declaration) {
        nextFormData.declaration = data.declaration as typeof nextFormData.declaration;
      }

      return { ...prev, formData: nextFormData };
    });
  }

  const handleAutoSave = useCallback(
    (step: number, data: Record<string, unknown>) => {
      if (registrationMode && !employeeRef.current.applicationRef) return;
      enqueuePersist(async () => {
        setIsSaving(true);
        try {
          const result = await saveStepAction(step, data, { validate: false });
          if (result.success && result.data?.savedAt) {
            setLastSavedAt(result.data.savedAt);
            mergeStepData(step, data);
          }
        } finally {
          setIsSaving(false);
        }
      });
    },
    [registrationMode]
  );

  const handleStepSubmit = useCallback(
    (data: Record<string, unknown>) => {
      const step = currentStep;
      if (advanceLockRef.current) return;
      advanceLockRef.current = true;
      window.setTimeout(() => {
        advanceLockRef.current = false;
      }, 400);

      mergeStepData(step, data);

      const next = step < ONBOARDING_TOTAL_STEPS ? step + 1 : step;
      const needsRegister =
        registrationMode && !employeeRef.current.applicationRef && step === 1;

      if (!needsRegister) {
        if (!completedSteps.includes(step)) {
          setCompletedSteps((prev) => [...prev, step].sort((a, b) => a - b));
        }
        if (next !== step) {
          setCurrentStep(next);
          scrollFormChromeIntoView();
        }
      }

      if (needsRegister || employeeRef.current.applicationRef) {
        persistFailedRef.current = false;
      }

      if (needsRegister) forceNextPersistRef.current = true;

      if (needsRegister && !sessionReadyResolveRef.current) {
        sessionReadyRef.current = new Promise<boolean>((resolve) => {
          sessionReadyResolveRef.current = resolve;
        });
      }

      if (needsRegister) setIsSaving(true);

      enqueuePersist(async () => {
        setIsSaving(true);
        try {
          const shouldRegister =
            registrationMode && !employeeRef.current.applicationRef && step === 1;

          if (shouldRegister) {
            try {
              const fullName =
                (data as { personalDetails?: { fullName?: string } }).personalDetails
                  ?.fullName ?? "";

              const result = await registerAndSaveStep1Action(
                { fullName, email: contactEmail, phone: contactPhone },
                data
              );

              if (!result.success) {
                persistFailedRef.current = true;
                sessionReadyResolveRef.current?.(false);
                sessionReadyResolveRef.current = undefined;
                toast({
                  title: "Registration failed",
                  description: result.error,
                  variant: "destructive",
                });
                setCurrentStep(1);
                return;
              }

              setEmployee((prev) => {
                const nextEmployee = {
                  ...prev,
                  applicationRef: result.applicationRef,
                  email: contactEmail,
                  phone: contactPhone,
                };
                employeeRef.current = nextEmployee;
                return nextEmployee;
              });
              setLastSavedAt(new Date().toISOString());
              sessionReadyResolveRef.current?.(true);
              sessionReadyResolveRef.current = undefined;
              if (!completedSteps.includes(step)) {
                setCompletedSteps((prev) => [...prev, step].sort((a, b) => a - b));
              }
              if (next !== step) {
                setCurrentStep(next);
                scrollFormChromeIntoView();
              }
            } catch (error) {
              persistFailedRef.current = true;
              sessionReadyResolveRef.current?.(false);
              sessionReadyResolveRef.current = undefined;
              throw error;
            }
          } else {
            const result = await saveStepAction(step, data, {
              validate: true,
              markComplete: true,
            });

            if (!result.success) {
              toast({
                title: "Validation error",
                description: result.error,
                variant: "destructive",
              });
              setCurrentStep((current) => (current === next ? step : current));
              return;
            }

            setLastSavedAt(result.data?.savedAt ?? null);
          }

          if (next !== step) {
            void goToStepAction(next).catch(() => undefined);
          }
        } finally {
          setIsSaving(false);
        }
      });
    },
    [
      currentStep,
      completedSteps,
      toast,
      registrationMode,
      contactEmail,
      contactPhone,
    ]
  );

  function getSubmitBlockers(signatureDataUrl?: string): string | null {
    const requiredDocs = getRequiredDocuments({
      isExServiceman: Boolean(formData.exServiceman?.isExServiceman),
      isGunman: Boolean(formData.gunman?.isGunman),
    });
    const liveSig = signatureDataUrl ?? formData.declaration?.signatureDataUrl;
    const hasLiveSig =
      typeof liveSig === "string" && liveSig.startsWith("data:image/");
    const missing = requiredDocs.filter((t) => {
      if (t === DocumentType.SIGNATURE && hasLiveSig) return false;
      return !documents.some((d) => d.documentType === t);
    });

    if (missing.length > 0) {
      return `Please upload: ${missing.join(", ")}`;
    }
    if (documents.some((d) => d._id.startsWith("local-"))) {
      return "Documents are still being saved. Try submit again in a moment.";
    }
    return null;
  }

  async function handleFinalSubmit() {
    const blocker = getSubmitBlockers();
    if (blocker) {
      toast({
        title: blocker.startsWith("Please upload") ? "Documents required" : "Please wait",
        description: blocker,
        variant: "destructive",
      });
      setCurrentStep(6);
      return false;
    }

    const ready = await ensureApplicationReady();
    if (!ready) {
      toast({
        title: "Please wait",
        description: "Your application is still being created. Try submit again in a moment.",
        variant: "destructive",
      });
      return false;
    }

    const submitResult = await submitApplicationAction();

    if (submitResult.success) {
      if (l1EditMode) {
        toast({
          title: "Updated",
          description: "Changes saved and form resubmitted for approval.",
          variant: "success",
        });
        window.location.assign(`/dashboard/l1/applications/${employee._id}`);
        return true;
      }
      if (!submitterMode) {
        toast({
          title: "Application submitted",
          description: "Your employment form has been submitted successfully.",
          variant: "success",
        });
        router.refresh();
      }
      return true;
    }

    toast({ title: "Submission failed", description: submitResult.error, variant: "destructive" });
    return false;
  }

  function handleDeclarationSubmit(data: Record<string, unknown>) {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;

    mergeStepData(7, data);
    if (!completedSteps.includes(7)) {
      setCompletedSteps((prev) => [...prev, 7].sort((a, b) => a - b));
    }

    const signatureDataUrl = (data as { declaration?: { signatureDataUrl?: string } })
      .declaration?.signatureDataUrl;
    const blocker = getSubmitBlockers(signatureDataUrl);
    if (blocker) {
      advanceLockRef.current = false;
      toast({
        title: blocker.startsWith("Please upload") ? "Documents required" : "Please wait",
        description: blocker,
        variant: "destructive",
      });
      setCurrentStep(6);
      return;
    }

    if (l1EditMode) {
      void (async () => {
        await persistChainRef.current;
        const save = await saveStepAction(7, data, { validate: true, markComplete: true });
        if (!save.success) {
          advanceLockRef.current = false;
          toast({
            title: "Validation error",
            description: save.error,
            variant: "destructive",
          });
          return;
        }
        const ok = await handleFinalSubmit();
        if (!ok) advanceLockRef.current = false;
      })();
      return;
    }

    setIsSubmitted(true);

    void (async () => {
      await persistChainRef.current;
      if (persistFailedRef.current) {
        setIsSubmitted(false);
        advanceLockRef.current = false;
        toast({
          title: "Could not save earlier steps",
          description: "Please go back, check the form, and tap Save & Continue again.",
          variant: "destructive",
        });
        return;
      }

      const save = await saveStepAction(7, data, { validate: true, markComplete: true });
      if (!save.success) {
        setIsSubmitted(false);
        advanceLockRef.current = false;
        toast({
          title: "Validation error",
          description: save.error,
          variant: "destructive",
        });
        return;
      }

      const ok = await handleFinalSubmit();
      if (!ok) {
        setIsSubmitted(false);
        advanceLockRef.current = false;
      }
    })();
  }

  function handleNext() {
    if (currentStep === 7) {
      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }

    if (currentStep === 6) {
      const next = 7;
      setCurrentStep(next);
      scrollFormChromeIntoView();
      void ensureApplicationReady().then((ok) => {
        if (ok) void goToStepAction(next).catch(() => undefined);
      });
      if (!completedSteps.includes(6)) {
        setCompletedSteps((prev) => [...prev, 6].sort((a, b) => a - b));
      }
      return;
    }

    const form = document.getElementById(formId) as HTMLFormElement | null;
    form?.requestSubmit();
  }

  function handleBack() {
    if (currentStep <= 1) return;
    const prev = currentStep - 1;
    setCurrentStep(prev);
    scrollFormChromeIntoView();
    if (!isNewRegistration) {
      void goToStepAction(prev).catch(() => undefined);
    }
  }

  function handleStepClick(step: number) {
    if (step === currentStep) return;
    if (registrationMode && !employeeRef.current.applicationRef && step > 1) {
      toast({
        title: "Save applicant details first",
        description: "Finish section 1 so the application is created, then upload documents.",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(step);
    scrollFormChromeIntoView();
    if (!isNewRegistration) {
      void goToStepAction(step).catch(() => undefined);
    }
  }

  if (isSubmitted) {
    return (
      <RegistrationSubmittedSuccess
        applicationRef={employee.applicationRef || "—"}
        employeeId={employee._id}
        submitterMode={submitterMode}
        onContinueEditing={
          submitterMode
            ? () => {
                setIsSubmitted(false);
                setCurrentStep(1);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="dashboard-form-panel flex h-[calc(100dvh-7.5rem)] min-h-0 flex-1 flex-col overflow-hidden">
      <div
        id="onboarding-form-chrome"
        className="relative z-10 shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-3 sm:px-6"
      >
        <FormStepNav
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          trailing={
            currentStep !== 6 && !isNewRegistration ? (
              <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />
            ) : null
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
        {employee.correctionNotes && (
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Reversed — Update Required
              </p>
              <p className="mt-1 text-sm text-amber-700">{employee.correctionNotes}</p>
              <p className="mt-2 text-xs text-amber-700">
                Please update the mentioned details and click Update &amp; Resubmit.
              </p>
            </div>
          </div>
        )}

        <div className="pb-2">
          {currentStep === 1 && (
            <ApplicantFormStep
              defaultValues={formData}
              email={contactEmail}
              phone={contactPhone}
              registrationMode={isNewRegistration}
              onContactChange={(field, value) => {
                if (field === "email") setContactEmail(value);
                else setContactPhone(value);
              }}
              formId={formId}
              onSubmit={handleStepSubmit}
              onAutoSave={(data) => void handleAutoSave(1, data)}
            />
          )}
          {currentStep === 2 && (
            <ReferencesStep
              defaultValues={formData}
              formId={formId}
              onSubmit={handleStepSubmit}
              onAutoSave={(data) => void handleAutoSave(2, data)}
            />
          )}
          {currentStep === 3 && (
            <FamilyStep
              defaultValues={formData}
              formId={formId}
              onSubmit={handleStepSubmit}
              onAutoSave={(data) => void handleAutoSave(3, data)}
            />
          )}
          {currentStep === 4 && (
            <NomineeStep
              defaultValues={formData}
              formId={formId}
              onSubmit={handleStepSubmit}
              onAutoSave={(data) => void handleAutoSave(4, data)}
            />
          )}
          {currentStep === 5 && (
            <AdditionalStep
              defaultValues={formData}
              formId={formId}
              onSubmit={handleStepSubmit}
              onAutoSave={(data) => void handleAutoSave(5, data)}
            />
          )}
          {currentStep === 6 && (
            <DocumentsStep
              documents={documents}
              onDocumentsChange={setDocuments}
              isExServiceman={Boolean(formData.exServiceman?.isExServiceman)}
              isGunman={Boolean(formData.gunman?.isGunman)}
              ensureApplicationReady={ensureApplicationReady}
            />
          )}
          {currentStep === 7 && (
            <DeclarationStep
              defaultValues={formData.declaration}
              formId={formId}
              onSubmit={handleDeclarationSubmit}
              onAutoSave={(data) => void handleAutoSave(7, data)}
            />
          )}
        </div>
      </div>

      <div className="relative z-10 shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep < ONBOARDING_TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              Save & Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {l1EditMode && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isSubmitting}
                  onClick={() => {
                    window.location.assign(
                      `/dashboard/l1/applications/${employee._id}`
                    );
                  }}
                >
                  Back to Review
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB]"
              >
                <Send className="h-4 w-4" />
                {l1EditMode ||
                employee.status === EmployeeStatus.L1_RETURNED ||
                employee.status === EmployeeStatus.L2_RETURNED ||
                employee.status === EmployeeStatus.SUBMITTED ||
                employee.status === EmployeeStatus.L1_REVIEW
                  ? "Update & Resubmit"
                  : "Submit Application"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
