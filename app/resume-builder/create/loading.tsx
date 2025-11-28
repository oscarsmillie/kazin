export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div>
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-28 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel Skeleton */}
          <div className="space-y-6">
            {/* AI Assistant Card Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-64 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Form Card Skeleton */}
            <div className="bg-white rounded-lg border p-6">
              <div className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-56 h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
              
              {/* Tabs Skeleton */}
              <div className="flex space-x-1 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>

              {/* Form Fields Skeleton */}
              <div className="space-y-4">
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                <div>
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse mb-6"></div>
              
              {/* Preview Area Skeleton */}
              <div className="bg-gray-50 border rounded-lg p-6 min-h-[800px]">
                <div className="bg-white rounded p-8 space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    <div className="w-56 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                  
                  {/* Content blocks */}
                  <div className="space-y-6 mt-8">
                    <div>
                      <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="space-y-2">
                        <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-4/5 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="w-28 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-5/6 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
                      <div className="space-y-1">
                        <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-36 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
