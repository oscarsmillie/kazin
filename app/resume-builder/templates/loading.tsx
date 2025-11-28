export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="w-96 h-5 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Template Categories Skeleton */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Templates Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6">
            <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button Skeleton */}
      <div className="flex justify-center">
        <div className="w-48 h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}
