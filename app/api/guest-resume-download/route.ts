// app/api/guest-resume-download/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import { generatePdfFromHtml } from "@/lib/server-pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 });
    }

    // Lazy load Supabase
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: resume, error: resumeError } = await supabase
      .from("guest_resumes")
      .select("*")
      .eq("id", resumeId)
      .maybeSingle();

    if (resumeError || !resume) {
      console.error("[v0] Guest resume fetch error:", resumeError);
      return NextResponse.json(
        { error: resumeError?.message || "Resume not found" },
        { status: resumeError ? 500 : 404 }
      );
    }

    if (resume.payment_status !== "paid") {
      return NextResponse.json({ error: "Resume must be paid before download" }, { status: 403 });
    }

    if (!resume.template_id) {
      return NextResponse.json({ error: "Template not specified" }, { status: 400 });
    }

    // Download template — use templateFileName to avoid conflict
    const templateId = resume.template_id.replace(/^\/+|\/+$/g, "");
    const templateFileName = templateId.endsWith(".htm") || templateId.endsWith(".html")
      ? templateId
      : `${templateId}.htm`;

    const { data: file, error: storageError } = await supabase.storage
      .from("templates")
      .download(templateFileName);

    if (storageError || !file) {
      console.error("[v0] Template download failed:", storageError);
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const htmlContent = await file.text();
    const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const cssStyles = cssMatch ? cssMatch[1] : "";

    // Parse resume data
    let contentData: any = {};
    try {
      contentData = typeof resume.resume_data === "string"
        ? JSON.parse(resume.resume_data)
        : resume.resume_data || resume;
    } catch (err) {
      console.error("[v0] Failed to parse resume_data:", err);
      contentData = resume;
    }

    const normalizedData = {
      personalInfo: contentData.personalInfo || {},
      professionalSummary: contentData.professionalSummary || contentData.summary || "",
      workExperience: contentData.workExperience || contentData.experience || [],
      education: contentData.education || [],
      skills: contentData.skills || [],
      achievements: contentData.achievements || [],
      certifications: contentData.certifications || [],
      references: contentData.references || [],
      languages: contentData.languages || [],
    };

    const info = normalizedData.personalInfo;

    const safeReplace = (html: string, key: string, value: string = "") =>
      html.replace(new RegExp(`{${key}}`, "g"), value || "");

    const renderBlock = (
      html: string,
      tag: string,
      items: any[],
      mapFn: (item: any, block: string) => string
    ) => {
      return html.replace(
        new RegExp(`{#${tag}}([\\s\\S]*?){/${tag}}`, "g"),
        (_, block) => items?.length ? items.map(item => mapFn(item, block)).join("") : ""
      );
    };

    let html = htmlContent;

    // Replace placeholders
    html = safeReplace(html, "FULL_NAME", info.fullName || `${info.firstName || ""} ${info.lastName || ""}`.trim());
    html = safeReplace(html, "NAME", info.firstName || "");
    html = safeReplace(html, "SURNAME", info.lastName || "");
    html = safeReplace(html, "TAGLINE", info.tagline || "Professional");
    html = safeReplace(html, "EMAIL", info.email || "");
    html = safeReplace(html, "PHONE", info.phone || "");
    html = safeReplace(html, "ADDRESS", info.address || "");
    html = safeReplace(html, "CITY", info.city || "");
    html = safeReplace(html, "LOCATION", info.location || "");
    html = safeReplace(html, "POSTCODE", info.postcode || "");
    html = safeReplace(html, "LINKEDIN", info.linkedin || "");
    html = safeReplace(html, "PORTFOLIO", info.portfolio || "");
    html = safeReplace(html, "PROFESSIONAL_SUMMARY", normalizedData.professionalSummary);

    // Render loops (EXPERIENCE, EDUCATION, etc.)
    html = renderBlock(html, "EXPERIENCE", normalizedData.workExperience, (exp, block) =>
      block
        .replace(/{JOB_TITLE}/g, exp.jobTitle || exp.role || "")
        .replace(/{COMPANY}/g, exp.company || exp.employer || "")
        .replace(/{START_DATE}/g, exp.startDate || "")
        .replace(/{END_DATE}/g, exp.endDate || (exp.current ? "Present" : ""))
        .replace(
          /{DESCRIPTION}/g,
          Array.isArray(exp.descriptions)
            ? exp.descriptions.join("<br>")
            : exp.description || ""
        )
    );

    html = renderBlock(html, "EDUCATION", normalizedData.education, (edu, block) =>
      block
        .replace(/{DEGREE}/g, edu.degree || "")
        .replace(/{INSTITUTION}/g, edu.institution || "")
        .replace(/{START_DATE}/g, edu.startDate || "")
        .replace(/{END_DATE}/g, edu.endDate || "")
        .replace(/{DESCRIPTION}/g, edu.description || "")
        .replace(/{GPA}/g, edu.gpa || "")
    );

    html = renderBlock(html, "SKILLS", normalizedData.skills, (s, block) =>
      block.replace(/{SKILL}/g, typeof s === "string" ? s : s.name || "")
    );

    html = renderBlock(html, "ACHIEVEMENTS", normalizedData.achievements, (a, block) =>
      block.replace(/{ACHIEVEMENT}/g, typeof a === "string" ? a : a.title || "")
    );

    html = renderBlock(html, "LANGUAGES", normalizedData.languages, (l, block) =>
      block.replace(/{LANGUAGE}/g, typeof l === "string" ? l : l.name || "")
    );

    html = renderBlock(html, "CERTIFICATIONS", normalizedData.certifications, (c, block) =>
      block.replace(/{CERTIFICATION}/g, typeof c === "string" ? c : c.name || "")
    );

    html = renderBlock(html, "REFERENCES", normalizedData.references, (r, block) =>
      block
        .replace(/{REFERENCE_NAME}/g, r.name || "")
        .replace(/{REFERENCE_COMPANY}/g, r.company || "")
        .replace(/{REFERENCE_EMAIL}/g, r.email || "")
        .replace(/{REFERENCE_PHONE}/g, r.phone || "")
    );

    html = html.replace(/{[^}]+}/g, ""); // Remove leftover placeholders

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${resume.title || "Resume"}</title>
          <style>
            body { background: white; font-family: 'Inter', system-ui, sans-serif; padding: 20px; line-height: 1.6; }
            ${cssStyles}
          </style>
        </head>
        <body>${html}</body>
      </html>`;

    // RENAMED: name → pdfFileName to avoid conflict
    const { pdf: pdfBase64, name: pdfFileName } = await generatePdfFromHtml(fullHtml, resume.title);

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // Update download count (fire and forget)
    supabase
      .from("guest_resumes")
      .update({ download_count: (resume.download_count || 0) + 1 })
      .eq("id", resumeId)
      .then(() => console.log("[v0] Download count updated"))
      .catch(console.error);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[v0] Guest resume download error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}