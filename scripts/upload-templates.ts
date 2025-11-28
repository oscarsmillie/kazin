// Script to upload HTML templates to Supabase Storage
// Run this in your development environment to upload template files

import { createClient } from "@supabase/supabase-js"
import fs from "fs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadTemplate(filePath: string, fileName: string) {
  try {
    console.log(`📤 Uploading ${fileName}...`)

    const fileBuffer = fs.readFileSync(filePath)

    const { data, error } = await supabase.storage.from("templates").upload(fileName, fileBuffer, {
      contentType: "text/html",
      upsert: true, // Overwrite if exists
    })

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error)
      return false
    }

    console.log(`✅ Successfully uploaded ${fileName}`)
    return true
  } catch (error) {
    console.error(`💥 Exception uploading ${fileName}:`, error)
    return false
  }
}

async function uploadAllTemplates() {
  console.log("🚀 Starting template upload process...")

  // Create bucket if it doesn't exist
  const { error: bucketError } = await supabase.storage.createBucket("templates", {
    public: true,
    fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
  })

  if (bucketError && !bucketError.message.includes("already exists")) {
    console.error("❌ Error creating bucket:", bucketError)
    return
  }

  // Define your template files here
  const templates = [
    { file: "./templates/green-minimalist.htm", name: "green-minimalist.htm" },
    { file: "./templates/modern-clean.htm", name: "modern-clean.htm" },
    { file: "./templates/classic.htm", name: "classic.htm" },
    { file: "./templates/executive.htm", name: "executive.htm" },
    { file: "./templates/creative.htm", name: "creative.htm" },
  ]

  let successCount = 0

  for (const template of templates) {
    if (fs.existsSync(template.file)) {
      const success = await uploadTemplate(template.file, template.name)
      if (success) successCount++
    } else {
      console.log(`⚠️  File not found: ${template.file}`)
    }
  }

  console.log(`\n🎉 Upload complete! ${successCount}/${templates.length} templates uploaded successfully.`)
}

// Run the upload
uploadAllTemplates()
