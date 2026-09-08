"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { SubmitterRegistrationItem } from "@/lib/services/submitter.service";
import { openSubmitterRegistrationAction } from "@/features/submitter/actions/submitter.actions";
import { EmployeeStatus } from "@/types/enums";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/features/l1/components/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataListToolbar } from "@/components/dashboard/DataListToolbar";
import { useFilteredList } from "@/components/dashboard/use-filtered-list";

interface RegistrationsTableProps {
  registrations: SubmitterRegistrationItem[];
  emptyMessage?: string;
  showViewLink?: boolean;
  viewPathPrefix?: string;
  allowSubmitterEdit?: boolean;
  showSubmitter?: boolean;
}

const EDITABLE = new Set([
  EmployeeStatus.DRAFT,
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
]);

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RegistrationsTable({
  registrations,
  emptyMessage = "No registrations found.",
  showViewLink = false,
  viewPathPrefix,
  allowSubmitterEdit = false,
  showSubmitter = false,
}: RegistrationsTableProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const list = useFilteredList(
    registrations,
    (row) => row.status,
    (row) =>
      [
        row.applicationRef,
        row.fullName,
        row.postAppliedFor,
        row.employeeId,
        row.temporaryEmployeeId,
        row.statusLabel,
        row.submittedByName,
        row.submittedByEmail,
      ]
        .filter(Boolean)
        .join(" "),
    (row) => row.submittedAt,
    (row) => row.fullName
  );

  if (registrations.length === 0) {
    return <EmptyState title={emptyMessage} description="Submitted registrations will appear here." />;
  }

  function handleEdit(id: string) {
    startTransition(async () => {
      const result = await openSubmitterRegistrationAction(id);
      if (!result.success) {
        toast({
          title: "Unable to open",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      window.location.assign(result.redirectTo);
    });
  }

  const showActions = showViewLink || allowSubmitterEdit;
  const viewHref = (id: string) =>
    viewPathPrefix
      ? `${viewPathPrefix}/${id}`
      : `/dashboard/submitter/registrations/${id}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <DataListToolbar
        search={list.search}
        onSearchChange={list.setSearch}
        statusFilter={list.statusFilter}
        onStatusFilterChange={list.setStatusFilter}
        sort={list.sort}
        onSortChange={list.setSort}
        total={list.total}
        page={list.page}
        pageCount={list.pageCount}
        onPageChange={list.setPage}
      />

      {list.total === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No matching registrations"
            description="Try a different search or approval status."
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Application Ref
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Post
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Submitted
                  </th>
                  {showSubmitter && (
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Submitted By
                    </th>
                  )}
                  {showActions && (
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-[#E2E8F0] last:border-0 transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="px-4 py-3 font-medium text-primary">{row.applicationRef}</td>
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3 text-[#64748B]">{row.postAppliedFor ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                      {row.temporaryEmployeeId && (
                        <p className="mt-1 font-mono text-xs text-emerald-800">
                          Temp ID: {row.temporaryEmployeeId}
                        </p>
                      )}
                      {row.rejectionComment && (
                        <p className="mt-1 max-w-md text-xs text-amber-800">
                          Note: {row.rejectionComment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">{formatDate(row.submittedAt)}</td>
                    {showSubmitter && (
                      <td className="px-4 py-3 text-[#64748B]">
                        {row.submittedByName || row.submittedByEmail ? (
                          <>
                            <span className="block font-medium text-[#0F172A]">
                              {row.submittedByName ?? "—"}
                            </span>
                            {row.submittedByEmail && (
                              <span className="block text-xs">{row.submittedByEmail}</span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    {showActions && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={viewHref(row._id)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3 text-sm font-medium text-[#1D4ED8] hover:bg-[#DBEAFE]"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                          {allowSubmitterEdit && EDITABLE.has(row.status) && (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleEdit(row._id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-medium text-primary hover:bg-[#F8FAFC] disabled:opacity-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {list.rows.map((row) => (
              <article
                key={row._id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-primary">{row.fullName}</p>
                    <p className="mt-0.5 text-xs text-[#64748B]">{row.applicationRef}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                {row.temporaryEmployeeId && (
                  <p className="mt-2 font-mono text-xs text-emerald-800">
                    Temp ID: {row.temporaryEmployeeId}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={viewHref(row._id)}
                    className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] text-sm font-medium text-[#1D4ED8]"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  {allowSubmitterEdit && EDITABLE.has(row.status) && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleEdit(row._id)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] text-sm font-medium disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
