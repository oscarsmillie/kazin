const { execSync } = require("child_process")

console.log("📦 Installing Gemini AI dependencies...")

try {
  console.log("🔧 Installing production dependencies...")
  execSync("npm install @google/genai mime", { stdio: "inherit" })

  console.log("🔧 Installing development dependencies...")
  execSync("npm install -D @types/node", { stdio: "inherit" })

  console.log("✅ All dependencies installed successfully!")
  console.log("")
  console.log("📋 Installed packages:")
  console.log("  - @google/genai (for Gemini 2.0 Flash Lite)")
  console.log("  - mime (for file type detection)")
  console.log("  - @types/node (TypeScript definitions)")
  console.log("")
  console.log("🚀 You can now test the Gemini integration at /test-gemini-2")
} catch (error) {
  console.error("❌ Installation failed:", error.message)
  process.exit(1)
}
