"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, BookOpen, Layers, FileText, Zap } from "lucide-react"

export default function TemplateGuide() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Resume Template System Guide</h1>
        <p className="text-xl text-gray-600">
          Complete technical reference for creating and customizing resume templates in KaziNest
        </p>
      </div>

      <Alert className="mb-8 bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          This guide explains the template system that powers KaziNest's resume builder. Use this to create new
          templates or modify existing ones.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blocks">Block System</TabsTrigger>
          <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Template System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">How Templates Work</h3>
                <p className="text-gray-700 mb-4">
                  KaziNest uses HTML templates with placeholder tags that get replaced with user data at render time.
                  The system supports two rendering methods:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-start gap-3">
                    <Badge className="mt-1">Modern</Badge>
                    <div>
                      <p className="font-medium">Block System (Recommended)</p>
                      <p className="text-sm text-gray-600">
                        For repeating sections like education, experience, skills. Uses{" "}
                        <code className="bg-gray-200 px-2 py-1 rounded">{"{{#block name}}"}</code> syntax
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-1">
                      Legacy
                    </Badge>
                    <div>
                      <p className="font-medium">Simple Placeholders</p>
                      <p className="text-sm text-gray-600">
                        For single-value fields like name, email. Uses{" "}
                        <code className="bg-gray-200 px-2 py-1 rounded">
                          {"{"}FIELD{"}"}
                        </code>{" "}
                        syntax
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Data Structure</h3>
                <p className="text-gray-700 mb-2">All templates receive a ResumeData object with this structure:</p>
                <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`{
  personalInfo: {
    firstName, lastName, fullName, email, phone,
    location, city, tagline, linkedin, portfolio
  }
  professionalSummary: string
  experience: [{
    jobTitle, company, location, startDate, endDate,
    current: boolean, descriptions: string[]
  }]
  education: [{
    degree, field, institution, startDate, endDate,
    gpa, description
  }]
  skills: string[] | [{name, level}]
  languages: [{name, proficiency}]
  certifications: [{name, issuer, date, credentialUrl}]
  achievements: [{title, description, date}]
  references: [{name, title, company, email, phone}]
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOCK SYSTEM TAB */}
        <TabsContent value="blocks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Block System (For Repeating Sections)
              </CardTitle>
              <CardDescription>Perfect for experience, education, skills, and other repeating data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Syntax</h3>
                <pre className="bg-gray-900 text-white p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`{#SECTION}
  <!-- Your HTML here, use {FIELD} for each field -->
  <h3>{JOB_TITLE}</h3>
  <p>{DESCRIPTION}</p>
{/SECTION}`}</code>
                </pre>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Available Blocks & Fields</h3>

                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">EXPERIENCE</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#EXPERIENCE}
<div class="job">
  <h3>{JOB_TITLE}</h3>
  <p class="company">{COMPANY}</p>
  <p class="dates">{START_DATE} - {END_DATE}</p>
  <p class="location">{LOCATION}</p>
  <ul>{DESCRIPTION}</ul>
</div>
{/EXPERIENCE}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> JOB_TITLE, COMPANY, START_DATE, END_DATE, LOCATION, DESCRIPTION
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">EDUCATION</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#EDUCATION}
<div class="education">
  <h3>{DEGREE} in {FIELD}</h3>
  <p>{INSTITUTION}</p>
  <p>{START_DATE} - {END_DATE}</p>
</div>
{/EDUCATION}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> DEGREE, FIELD, INSTITUTION, START_DATE, END_DATE, DESCRIPTION, GPA
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">SKILLS</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#SKILLS}
<span class="skill">{SKILL}</span>
{/SKILLS}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Field:</strong> SKILL
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">CERTIFICATIONS</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#CERTIFICATIONS}
<div class="cert">
  <p>{CERTIFICATION}</p>
  <span>{CERTIFICATION_DATE}</span>
</div>
{/CERTIFICATIONS}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> CERTIFICATION, CERTIFICATION_DATE
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">LANGUAGES</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#LANGUAGES}
<span>{LANGUAGE} ({PROFICIENCY})</span>
{/LANGUAGES}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> LANGUAGE, PROFICIENCY
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">ACHIEVEMENTS</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#ACHIEVEMENTS}
<div class="award">
  <h4>{ACHIEVEMENT}</h4>
  <p>{ACHIEVEMENT_DATE}</p>
</div>
{/ACHIEVEMENTS}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> ACHIEVEMENT, ACHIEVEMENT_DATE
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">
                      <Badge className="mr-2">REFERENCES</Badge>
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-2">
                      <code>{`{#REFERENCES}
<div class="ref">
  <h4>{REFERENCE_NAME}</h4>
  <p>{REFERENCE_COMPANY}</p>
  <p>{REFERENCE_EMAIL}</p>
</div>
{/REFERENCES}`}</code>
                    </pre>
                    <p className="text-xs text-gray-500">
                      <strong>Fields:</strong> REFERENCE_NAME, REFERENCE_COMPANY, REFERENCE_EMAIL, REFERENCE_PHONE
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLACEHOLDERS TAB */}
        <TabsContent value="placeholders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Simple Placeholders (For Single Values)
              </CardTitle>
              <CardDescription>Use these for direct field replacement in header/footer sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                <div className="space-y-2">
                  {[
                    { code: "{FULL_NAME}", desc: "Full name (first + last)" },
                    { code: "{NAME}", desc: "First name only" },
                    { code: "{SURNAME}", desc: "Last name only" },
                    { code: "{EMAIL}", desc: "Email address" },
                    { code: "{PHONE}", desc: "Phone number" },
                    { code: "{LOCATION}", desc: "City/location" },
                    { code: "{ADDRESS}", desc: "Full address" },
                    { code: "{CITY}", desc: "City only" },
                    { code: "{POSTCODE}", desc: "Postal code" },
                    { code: "{TAGLINE}", desc: "Professional headline" },
                    { code: "{LINKEDIN}", desc: "LinkedIn URL" },
                    { code: "{PORTFOLIO}", desc: "Portfolio/website URL" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                      <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono flex-1">{item.code}</code>
                      <span className="text-sm text-gray-600">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Professional Summary</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono flex-1">
                    {"{"}PROFESSIONAL_SUMMARY{"}"}
                  </code>
                  <span className="text-sm text-gray-600">Professional summary section</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXAMPLES TAB */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Minimal Template Example
              </CardTitle>
              <CardDescription>A working template using the block system</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-white p-4 rounded-lg text-xs overflow-x-auto max-h-[600px]">
                <code>{`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
    }
    .header { border-bottom: 2px solid #333; margin-bottom: 20px; }
    .name { font-size: 24px; font-weight: bold; }
    .contact { font-size: 12px; color: #666; }
    .section-title { font-size: 14px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <p class="name">{FULL_NAME}</p>
    <div class="contact">{EMAIL} | {PHONE} | {LOCATION}</div>
  </div>

  {PROFESSIONAL_SUMMARY}

  <h2 class="section-title">Experience</h2>
  {#EXPERIENCE}
  <div>
    <h3>{JOB_TITLE} at {COMPANY}</h3>
    <p>{START_DATE} - {END_DATE}</p>
    <p>{DESCRIPTION}</p>
  </div>
  {/EXPERIENCE}

  <h2 class="section-title">Education</h2>
  {#EDUCATION}
  <div>
    <h3>{DEGREE} in {FIELD}</h3>
    <p>{INSTITUTION} ({START_DATE} - {END_DATE})</p>
  </div>
  {/EDUCATION}

  <h2 class="section-title">Skills</h2>
  {#SKILLS}
  <span>{SKILL}</span>
  {/SKILLS}
</body>
</html>`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ TAB */}
        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">What if a user doesn't fill in a field?</h4>
                <p className="text-gray-700">
                  Empty fields render as empty strings. If an entire block has no data, it won't render. This prevents
                  blank lines or broken formatting.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Can I mix block and placeholder syntax?</h4>
                <p className="text-gray-700">
                  Yes! Process blocks first, then placeholders. You can freely use both in the same template.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How do I hide optional sections?</h4>
                <p className="text-gray-700">
                  Blocks automatically hide if empty. For example, if a user has no certifications, the entire
                  certifications block won't render.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Can I add custom CSS?</h4>
                <p className="text-gray-700">
                  Yes! Include a &lt;style&gt; tag in your template. CSS is extracted during rendering for maximum PDF
                  compatibility.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">What's the max file size?</h4>
                <p className="text-gray-700">
                  Templates should stay under 5MB. Keep file sizes minimal for fast loading.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">How do I test my template?</h4>
                <p className="text-gray-700">
                  Upload via admin dashboard, then use the preview feature in resume builder to see how it renders with
                  sample data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
