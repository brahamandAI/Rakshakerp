import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export function DocumentsLoadingFallback() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

