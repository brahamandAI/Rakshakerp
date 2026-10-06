"use client";

import { useEffect, useState } from "react";
import { DownloadExcelButton, type ExportButtonScope } from "@/features/export/components/DownloadExcelButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ListExportToolbarProps {
  scope: ExportButtonScope;
  filteredIds: string[];
  dateFrom: string;
  dateTo: string;
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
}

export function ListExportToolbar({
  scope,
  filteredIds,
  dateFrom,
  dateTo,
  selectedIds,
  onSelectedIdsChange,
}: ListExportToolbarProps) {
  const selectedCount = selectedIds.size;
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      onSelectedIdsChange(new Set());
      return;
    }
    onSelectedIdsChange(new Set(filteredIds));
  }

  const exportIds =
    selectedCount > 0 ? Array.from(selectedIds) : undefined;

  return (
    <div className="flex flex-col gap-2 border-b border-[#E8EEF5] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id={`export-select-all-${scope}`}
          label={
            allFilteredSelected
              ? `All filtered selected (${filteredIds.length})`
              : `Select all filtered (${filteredIds.length})`
          }
          checked={allFilteredSelected}
          onChange={toggleSelectAllFiltered}
          disabled={filteredIds.length === 0}
        />
        {selectedCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onSelectedIdsChange(new Set())}
          >
            Clear selection ({selectedCount})
          </Button>
        )}
        <p className="text-xs text-[#64748B]">
          {selectedCount > 0
            ? `Download will include ${selectedCount} selected form${selectedCount === 1 ? "" : "s"}.`
            : "Download uses current date filters (all matching forms) unless you select specific ones."}
        </p>
      </div>
      <DownloadExcelButton
        scope={scope}
        employeeIds={exportIds}
        dateFrom={dateFrom || undefined}
        dateTo={dateTo || undefined}
        label={
          selectedCount > 0
            ? `Download selected (${selectedCount})`
            : "Download filtered"
        }
        disabled={filteredIds.length === 0 && selectedCount === 0}
      />
    </div>
  );
}

/** Keep selection in sync when the filtered id set shrinks. */
export function useSyncedSelection(filteredIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const allowed = new Set(filteredIds);
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [filteredIds]);

  return { selectedIds, setSelectedIds };
}

export function toggleIdSelection(
  selectedIds: Set<string>,
  id: string,
  checked: boolean
): Set<string> {
  const next = new Set(selectedIds);
  if (checked) next.add(id);
  else next.delete(id);
  return next;
}
