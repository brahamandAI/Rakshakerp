"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Download,
  Eye,
  Printer,
  Shield,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ApplicationStatusData,
  TimelineStep,
} from "@/features/application-status/constants";
import { cn } from "@/lib/utils";

interface ApplicationStatusPortalProps {
  data: ApplicationStatusData;
}

export function ApplicationStatusPortal({ data }: ApplicationStatusPortalProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary lg:hidden">
          Application Status
        </h1>
        <p className="mt-1 text-sm text-[#64748B] lg:hidden">
          Track your onboarding progress below.
        </p>
      </div>

      {data.displayStatus === "CORRECTION_REQUIRED" && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Action Required</p>
                <p className="mt-1 text-sm text-amber-800">
                  {data.correctionNotes ??
                    "Your application requires corrections. Please update and resubmit."}
                </p>
              </div>
            </div>
            {data.editUrl && (
              <Link href={data.editUrl}>
                <Button variant="accent">
                  Edit Application
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {data.displayStatus === "REJECTED" && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="flex gap-3 p-5">
            <XCircle className="h-6 w-6 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Application Rejected</p>
              <p className="mt-1 text-sm text-red-800">
                {data.rejectionReason ??
                  "Your application was not approved. Contact support for more information."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.idCard && (
        <Card className="overflow-hidden border-primary/20 shadow-md">
          <CardContent className="flex flex-col gap-4 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold text-primary">ID Card Generated</p>
                <p className="text-sm text-[#64748B]">
                  Generated on{" "}
                  {new Date(data.idCard.generatedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={data.idCard.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View ID Card
                </Button>
              </a>
              <a href={data.idCard.url} target="_blank" rel="noopener noreferrer" download>
                <Button variant="accent" size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Download ID Card
                </Button>
              </a>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(data.idCard!.url, "_blank")}
              >
                <Printer className="h-4 w-4" />
                Print ID Card
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <h2 className="font-heading text-sm font-semibold text-primary">
            Progress
          </h2>
          <div className="mt-3">
            <StatusTimeline steps={data.timeline} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-1">
      {steps.map((step, index) => (
        <li key={step.id} className="flex items-center gap-1">
          {index > 0 && <span className="text-[10px] text-[#CBD5E1]" aria-hidden>›</span>}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
              step.state === "completed" && "bg-emerald-50 text-emerald-700",
              step.state === "current" && "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
              step.state === "error" && "bg-red-50 text-red-700",
              step.state === "pending" && "bg-[#F1F5F9] text-[#94A3B8]"
            )}
          >
            {step.title}
          </span>
        </li>
      ))}
    </ol>
  );
}
