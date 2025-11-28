import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading checkout...</p>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Skeleton className="h-12 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>

              <div className="space-y-4 mb-8">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              <Skeleton className="h-12 w-full rounded-lg" />

              <div className="mt-6 text-center space-y-2">
                <Skeleton className="h-4 w-48 mx-auto" />
                <Skeleton className="h-3 w-56 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
