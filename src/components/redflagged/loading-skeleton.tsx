export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Verdict Card Skeleton */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 md:p-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-slate-200" />
            <div className="space-y-3">
              <div className="w-48 h-10 rounded-lg bg-slate-200" />
              <div className="w-32 h-5 rounded bg-slate-200" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="w-20 h-12 rounded-lg bg-slate-200 ml-auto" />
            <div className="w-24 h-4 rounded bg-slate-200" />
          </div>
        </div>
        <div className="w-full h-16 rounded-lg bg-slate-200" />
      </div>

      {/* Red Flags Panel Skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-slate-200" />
          <div className="w-32 h-6 rounded bg-slate-200" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 p-5 bg-white"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="w-20 h-5 rounded bg-slate-200" />
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-200" />
              </div>
              <div className="w-3/4 h-6 rounded bg-slate-200 mb-3" />
              <div className="w-full h-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Questions Section Skeleton */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <div className="w-40 h-6 rounded bg-slate-200" />
              <div className="w-56 h-4 rounded bg-slate-200" />
            </div>
          </div>
          <div className="w-28 h-10 rounded-lg bg-slate-200" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex gap-4 p-3 bg-white rounded-lg border border-slate-100"
            >
              <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="w-full h-5 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex gap-1.5">
          <div
            className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <p className="text-sm text-slate-400 font-medium">
          Preparing your report...
        </p>
      </div>
    </div>
  );
}
