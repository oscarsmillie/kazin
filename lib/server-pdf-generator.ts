import puppeteer from "puppeteer-core";
// 🚨 CHANGED: Using the modern, compatible serverless Chromium package
import chromium from "@sparticuz/chromium"; 

export async function generatePdfFromHtml(
  html: string,
  resumeTitle?: string
): Promise<{ pdf: string; name: string }> {
  let browser = null;

  try {
    // 🚨 UPDATED LOGIC: executablePath is now an async method (chromium.executablePath())
    // This is the CRITICAL fix for the "executablePath must be specified" error.
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_PATH ||
      (process.env.NODE_ENV === "production"
        ? await chromium.executablePath() // <--- Call as a function
        : "/usr/bin/chromium"); // local Linux dev or Docker

    browser = await puppeteer.launch({
      executablePath,
      // 🚨 UPDATED: Use the package's recommended headless mode
      headless: chromium.headless, 
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-web-security",
        "--single-process",
        // 🚨 UPDATED: Use the package's argument array for production
        ...(process.env.NODE_ENV === "production" ? chromium.args : []),
      ],
      // 💡 Recommended addition for consistency in serverless environments
      defaultViewport: chromium.defaultViewport, 
    });

    const page = await browser.newPage();

    // Existing viewport and content settings (Intact)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Existing font and image loading wait logic (Intact)
    await page.evaluate(() =>
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.images).map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                })
        ),
      ])
    );

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    const safeName = (resumeTitle || "Resume")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    return { pdf: pdfBase64, name: `${safeName}_${Date.now()}.pdf` };
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
}
