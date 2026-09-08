"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { ApplicationListItem } from "@/lib/services/l1.service";
import { StatusBadge } from "@/features/l1/components/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataListToolbar } from "@/components/dashboard/DataListToolbar";
import { useFilteredList } from "@/components/dashboard/use-filtered-list";
import { EmployeeStatus } from "@/types/enums";

interface ApplicationTableProps {
  applications: ApplicationListItem[];
  emptyMessage?: string;
  emptyDescription?: string;
  showEmployeeId?: boolean;
  showL2ReverseNote?: boolean;
  viewPathPrefix?: string;
}

const L1_EDITABLE = new Set<EmployeeStatus>([
  EmployeeStatus.SUBMITTED,
  EmployeeStatus.L1_REVIEW,
  EmployeeStatus.L1_RETURNED,
  EmployeeStatus.L2_RETURNED,
]);

const ACTION_BTN =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium leading-none";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApplicationTable({
  applications,
  emptyMessage = "No applications found.",
  emptyDescription = "New registrations will appear here when they enter your queue.",
  showEmployeeId = false,
  showL2ReverseNote = false,
  viewPathPrefix = "/dashboard/l1/applications",
}: ApplicationTableProps) {
  const list = useFilteredList(
    applications,
    (app) => app.status,
    (app) =>
      [app.applicationRef, app.fullName, app.postAppliedFor, app.employeeId, app.submittedByName, app.submittedByEmail]
        .filter(Boolean)
        .join(" "),
    (app) => app.submittedAt ?? app.l1ApprovedAt,
    (app) => app.fullName
  );

  const isL1Table = viewPathPrefix.startsWith("/dashboard/l1");

  if (applications.length === 0) {
    return <EmptyState title={emptyMessage} description={emptyDescription} />;
  }

  function renderActions(app: ApplicationListItem, fullWidth = false) {
    const showEdit = isL1Table && L1_EDITABLE.has(app.status);
    return (
      <div
        className={
          fullWidth
            ? "mt-3 flex items-center gap-2"
            : "inline-flex items-center justify-end gap-2"
        }
      >
        <Link
          href={`${viewPathPrefix}/${app._id}`}
          prefetch
          className={`${ACTION_BTN} border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] transition hover:bg-[#DBEAFE] ${
            fullWidth ? "h-9 flex-1" : ""
          }`}
        >
          <Eye className="h-3.5 w-3.5 shrink-0" />
          View
        </Link>
        {showEdit && (
          <Link
            href={`${viewPathPrefix}/${app._id}/edit`}
            prefetch
            className={`${ACTION_BTN} border-[#E2E8F0] bg-white text-primary transition hover:bg-[#F8FAFC] ${
              fullWidth ? "h-9 flex-1" : ""
            }`}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            Edit
          </Link>
        )}
      </div>
    );
  }

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
            <table className="w-full min-w-[880px] text-sm">
              <thead className="sticky top-0 z-[1]">
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Application Ref
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Post
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    {showL2ReverseNote ? "L2 Reverse Note" : "Submitted By"}
                  </th>
                  {showEmployeeId && (
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Employee ID
                    </th>
                  )}
                  <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Submitted
                  </th>
                  <th className="w-[1%] whitespace-nowrap px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((app) => (
                  <tr
                    key={app._id}
                    className="border-b border-[#E2E8F0] last:border-0 transition-colors hover:bg-[#F8FAFC]"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle font-medium text-primary">
                      {app.applicationRef}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle font-medium text-[#0F172A]">
                      {app.fullName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-[#64748B]">
                      {app.postAppliedFor ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                      <StatusBadge status={app.status} />
                    </td>
                    {showL2ReverseNote ? (
                      <td className="max-w-[22rem] px-4 py-3.5 align-middle text-[#64748B]">
                        {app.l2ReverseNote ? (
                          <>
                            <span className="block whitespace-pre-line text-[#334155]">
                              {app.l2ReverseNote}
                            </span>
                            {(app.l2ReversedByName || app.l2ReversedAt) && (
                              <span className="mt-1 block text-xs text-[#94A3B8]">
                                {app.l2ReversedByName ?? "L2"}
                                {app.l2ReversedAt ? ` · ${formatDate(app.l2ReversedAt)}` : ""}
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : (
                      <td className="px-4 py-3.5 align-middle text-[#64748B]">
                        {app.submittedByName || app.submittedByEmail ? (
                          <>
                            <span className="block font-medium text-[#0F172A]">
                              {app.submittedByName ?? "—"}
                            </span>
                            {app.submittedByEmail && (
                              <span className="block text-xs text-[#64748B]">
                                {app.submittedByEmail}
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                    {showEmployeeId && (
                      <td className="whitespace-nowrap px-4 py-3.5 align-middle font-mono text-sm">
                        {app.employeeId ?? "—"}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-[#64748B]">
                      {formatDate(app.submittedAt ?? app.l1ApprovedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle text-right">
                      {renderActions(app)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {list.rows.map((app) => (
              <article
                key={app._id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-primary">{app.fullName}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#64748B]">
                      {app.applicationRef}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                  <div>
                    <dt className="uppercase tracking-wide">Post</dt>
                    <dd className="mt-0.5 text-sm text-[#0F172A]">{app.postAppliedFor ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">Submitted</dt>
                    <dd className="mt-0.5 text-sm text-[#0F172A]">
                      {formatDate(app.submittedAt ?? app.l1ApprovedAt)}
                    </dd>
                  </div>
                  {showEmployeeId && (
                    <div className="col-span-2">
                      <dt className="uppercase tracking-wide">Employee ID</dt>
                      <dd className="mt-0.5 font-mono text-sm text-[#0F172A]">
                        {app.employeeId ?? "—"}
                      </dd>
                    </div>
                  )}
                </dl>
                {renderActions(app, true)}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
