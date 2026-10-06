"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { APPROVAL_STATUS_SELECT_OPTIONS } from "@/lib/ui/approval-status-filter";
import type { ListSort } from "@/components/dashboard/use-filtered-list";
import {
  REGISTRATION_SEARCH_FIELD_OPTIONS,
  type RegistrationSearchField,
} from "@/lib/ui/registration-search";

interface DataListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchField: RegistrationSearchField;
  onSearchFieldChange: (value: RegistrationSearchField) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sort: ListSort;
  onSortChange: (value: ListSort) => void;
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  searchPlaceholder?: string;
  showStatusFilter?: boolean;
  showSort?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  showDateFilter?: boolean;
}

const SORT_OPTIONS = [
  { value: "default", label: "Default order" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
];

function placeholderForField(field: RegistrationSearchField): string {
  const option = REGISTRATION_SEARCH_FIELD_OPTIONS.find((o) => o.value === field);
  return option ? `Enter ${option.label}` : "Enter search value";
}

export function DataListToolbar({
  search,
  onSearchChange,
  searchField,
  onSearchFieldChange,
  statusFilter,
  onStatusFilterChange,
  sort,
  onSortChange,
  total,
  page,
  pageCount,
  onPageChange,
  searchPlaceholder,
  showStatusFilter = true,
  showSort = true,
  dateFrom = "",
  dateTo = "",
  onDateFromChange,
  onDateToChange,
  showDateFilter = false,
}: DataListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#E8EEF5] bg-[#F8FAFC] px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="w-full lg:w-56">
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"
            htmlFor="list-search-field"
          >
            Search By
          </label>
          <Select
            id="list-search-field"
            value={searchField}
            onChange={(e) =>
              onSearchFieldChange(e.target.value as RegistrationSearchField)
            }
            options={REGISTRATION_SEARCH_FIELD_OPTIONS}
            className="h-10 py-0 leading-none"
            aria-label="Search field"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"
            htmlFor="list-search"
          >
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              id="list-search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? placeholderForField(searchField)}
              className="h-10 py-0 leading-none pl-9"
              aria-label="Search registrations"
            />
          </div>
        </div>
        {showStatusFilter && (
          <div className="w-full lg:w-56">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]" htmlFor="approval-status-filter">
              Approval Status
            </label>
            <Select
              id="approval-status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              options={APPROVAL_STATUS_SELECT_OPTIONS}
              className="h-10 py-0 leading-none"
            />
          </div>
        )}
        {showSort && (
          <div className="w-full lg:w-44">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"
              htmlFor="list-sort"
            >
              Sort
            </label>
            <Select
              id="list-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ListSort)}
              options={SORT_OPTIONS}
              className="h-10 py-0 leading-none"
              aria-label="Sort"
            />
          </div>
        )}
      </div>

      {showDateFilter && onDateFromChange && onDateToChange && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:w-44">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"
              htmlFor="list-date-from"
            >
              From date
            </label>
            <Input
              id="list-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-10 py-0 leading-none"
            />
          </div>
          <div className="w-full sm:w-44">
            <label
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]"
              htmlFor="list-date-to"
            >
              To date
            </label>
            <Input
              id="list-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-10 py-0 leading-none"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => {
                onDateFromChange("");
                onDateToChange("");
              }}
            >
              Clear dates
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
        <p>
          {total === 0
            ? "No matching records"
            : `${total} registration${total === 1 ? "" : "s"}`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[4.5rem] text-center font-medium text-[#334155]">
              {page} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
