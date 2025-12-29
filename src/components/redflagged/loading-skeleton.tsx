export function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Verdict Card Skeleton */}
      <div className="rounded-xl bg-gray-100 p-8 md:p-12">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg shimmer" />
            <div className="space-y-3">
              <div className="w-48 h-12 rounded shimmer" />
              <div className="w-32 h-5 rounded shimmer" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="w-16 h-10 rounded shimmer ml-auto" />
            <div className="w-20 h-3 rounded shimmer" />
          </div>
        </div>
        <div className="w-full h-16 rounded shimmer" />
      </div>

      {/* Red Flags Panel Skeleton */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded shimmer" />
          <div className="w-32 h-6 rounded shimmer" />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-5 md:p-6 bg-white">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md shimmer" />
                  <div className="w-16 h-5 rounded shimmer" />
                </div>
                <div className="w-6 h-6 rounded shimmer" />
              </div>
              <div className="w-3/4 h-7 rounded shimmer mb-3" />
              <div className="w-full h-12 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Questions Section Skeleton */}
      <div className="rounded-lg bg-gray-50 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="w-40 h-7 rounded shimmer" />
              <div className="w-48 h-4 rounded shimmer" />
            </div>
          </div>
          <div className="w-24 h-10 rounded-md shimmer" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-6 rounded shimmer flex-shrink-0" />
              <div className="w-full h-6 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm text-gray-600 font-medium">Analyzing vehicle data...</p>
      </div>
    </div>
  );
}
