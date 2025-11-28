import TemplateSwitcher from "@/components/template-switcher"

export default function TemplatePreviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Template Preview</h1>
          <p className="text-gray-600">Select and preview resume templates stored in Supabase Storage</p>
        </div>

        <TemplateSwitcher />
      </div>
    </div>
  )
}
