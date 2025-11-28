import { supabase, debugSupabaseConfig } from "./supabase"
import type { ResumeTemplate } from "./types"
import type { ResumeData } from "./template-types"

// Cache for templates to improve loading speed
let templatesCache: ResumeTemplate[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getResumeTemplates = async (includesPremium = false): Promise<ResumeTemplate[]> => {
  try {
    // Check cache first for faster loading
    const now = Date.now()
    if (templatesCache && now - cacheTimestamp < CACHE_DURATION) {
      console.log("✅ Using cached templates")
      return templatesCache.filter((template) => includesPremium || !template.is_premium)
    }

    console.log("🔍 Fetching templates from Supabase Storage...")

    // Fetch ALL files from root of "templates" bucket
    const { data: files, error: listError } = await supabase.storage.from("templates").list("", {
      limit: 1000,
      offset: 0,
    })

    if (listError) throw new Error(`Storage list error: ${listError.message}`)
    if (!files || files.length === 0) throw new Error("No template files found in storage")

    console.log(`📄 Found ${files.length} files in storage`)

    // Filter HTML templates
    const templateFiles = files.filter((f) => f.name.endsWith(".htm") || f.name.endsWith(".html"))
    console.log(`📄 Found ${templateFiles.length} HTML template files`)

    // Fetch thumbnails list
    const { data: thumbnailFiles } = await supabase.storage.from("templates").list("thumbnails", {
      limit: 1000,
    })

    const thumbnails = thumbnailFiles || []
    console.log(`🖼️ Found ${thumbnails.length} thumbnail files`)

    const templatePromises = templateFiles.map(async (file) => {
      try {
        const { data: templateData, error: downloadError } = await supabase.storage
          .from("templates")
          .download(file.name)

        if (downloadError || !templateData) {
          console.warn(`⚠️ Failed to download ${file.name}:`, downloadError)
          return null
        }

        const htmlContent = await templateData.text()
        const templateName = file.name.replace(/\.(htm|html)$/, "")

        // Match thumbnails
        const thumb = thumbnails.find((t) => t.name.includes(templateName))
        let thumbnailUrl = null
        if (thumb) {
          const { data: thumbUrl } = supabase.storage
            .from("templates")
            .getPublicUrl(`thumbnails/${thumb.name}`)
          thumbnailUrl = thumbUrl.publicUrl
        }

        const template: ResumeTemplate = {
          id: templateName,
          name: formatTemplateName(templateName),
          description: `Professional template: ${formatTemplateName(templateName)}`,
          category: determineCategoryFromName(templateName),
          html_template: htmlContent,
          css_styles: extractCSSFromHTML(htmlContent),
          is_premium: templateName.toLowerCase().includes("premium") || templateName.toLowerCase().includes("pro"),
          is_active: true,
          download_count: Math.floor(Math.random() * 1000) + 100,
          rating: 4.5 + Math.random() * 0.5,
          preview_image_url: thumbnailUrl,
          thumbnail_url: thumbnailUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          template_config: {
            sections: [
              { id: "header", type: "header", title: "Header", required: true, order: 1 },
              { id: "summary", type: "summary", title: "Professional Summary", required: false, order: 2 },
              { id: "experience", type: "experience", title: "Work Experience", required: true, order: 3 },
              { id: "education", type: "education", title: "Education", required: true, order: 4 },
              { id: "skills", type: "skills", title: "Skills", required: false, order: 5 },
            ],
            layout: { type: "single-column" },
            style: {
              colorScheme: { primary: "#2563eb", text: "#1e293b", background: "#ffffff" },
              typography: { headingFont: "Arial", bodyFont: "Arial" },
            },
          },
        }

        return template
      } catch (err) {
        console.warn(`⚠️ Error processing ${file.name}:`, err)
        return null
      }
    })

    const templates = (await Promise.all(templatePromises)).filter(Boolean) as ResumeTemplate[]

    templatesCache = templates
    cacheTimestamp = now

    console.log(`✅ Loaded ${templates.length} templates from storage`)
    return templates.filter((t) => includesPremium || !t.is_premium)
  } catch (error) {
    console.error("💥 Storage fetch error:", error)
    throw error
  }
}

export const getTemplateById = async (templateId: string): Promise<ResumeTemplate | null> => {
  if (!templateId) return null

  try {
    console.log(`🔍 Fetching template by ID: ${templateId}`)

    // ✅ Strip any "storage-" prefix if passed by mistake
    const cleanName = templateId.replace(/^storage-/, "")
    const fileName = `${cleanName}.htm`

    // ✅ Check cache
    if (templatesCache) {
      const cached = templatesCache.find((t) => t.id === cleanName)
      if (cached) {
        console.log(`✅ Found in cache: ${cached.name}`)
        return cached
      }
    }

    console.log(`📥 Downloading template from Supabase: ${fileName}`)
    const { data: templateData, error } = await supabase.storage.from("templates").download(fileName)
    if (error || !templateData) {
      console.error("❌ Template not found in Supabase:", error?.message)
      return null
    }

    const htmlContent = await templateData.text()
    const css = extractCSSFromHTML(htmlContent)

    const template: ResumeTemplate = {
      id: cleanName,
      name: formatTemplateName(cleanName),
      description: `Professional template: ${formatTemplateName(cleanName)}`,
      category: determineCategoryFromName(cleanName),
      html_template: htmlContent,
      css_styles: css,
      is_premium: cleanName.toLowerCase().includes("premium") || cleanName.toLowerCase().includes("pro"),
      is_active: true,
      download_count: Math.floor(Math.random() * 1000),
      rating: 4.5,
      preview_image_url: null,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      template_config: {
        sections: [
          { id: "header", type: "header", title: "Header", required: true, order: 1 },
          { id: "summary", type: "summary", title: "Professional Summary", required: false, order: 2 },
          { id: "experience", type: "experience", title: "Work Experience", required: true, order: 3 },
          { id: "education", type: "education", title: "Education", required: true, order: 4 },
          { id: "skills", type: "skills", title: "Skills", required: false, order: 5 },
        ],
        layout: { type: "single-column" },
        style: {
          colorScheme: { primary: "#2563eb", text: "#1e293b", background: "#ffffff" },
          typography: { headingFont: "Arial", bodyFont: "Arial" },
        },
      },
    }

    console.log(`✅ Successfully fetched template: ${template.name}`)
    return template
  } catch (error) {
    console.error("💥 Error fetching template:", error)
    return null
  }
}

// ---------------- Helper functions ----------------
function formatTemplateName(fileName: string): string {
  return fileName.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).trim()
}

function determineCategoryFromName(fileName: string): ResumeTemplate["category"] {
  const name = fileName.toLowerCase()
  if (name.includes("entry") || name.includes("student")) return "entry-level"
  if (name.includes("senior") || name.includes("experienced")) return "mid-level"
  if (name.includes("executive") || name.includes("pro")) return "professional"
  return "mid-level"
}

function extractCSSFromHTML(html: string): string {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  return styleMatch ? styleMatch[1] : ""
}
