export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <div className="w-48 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Info Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-16 bg-gray-200 rounded animate-pulse"></div>
                <div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Download Options Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-28 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Preview Skeleton */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-6">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
              
              <div className="bg-gray-50 border rounded-lg p-8 min-h-[1000px]">
                <div className="bg-white rounded p-8 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    <div className="w-56 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                  
                  {/* Content sections */}
                  {[1, 2, 3, 4].map((section) => (
                    <div key={section}>
                      <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-4/5 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
