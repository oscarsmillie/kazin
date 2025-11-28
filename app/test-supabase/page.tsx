import SupabaseTest from "@/components/supabase-test"

export default function TestSupabasePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
        <p className="text-gray-600">Test your Supabase connection and configuration</p>
      </div>

      <div className="flex justify-center">
        <SupabaseTest />
      </div>
    </div>
  )
}
