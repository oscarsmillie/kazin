"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { generateProfessionalSummary, generateWorkDescription, generateSkillsSuggestions } from "@/lib/gemini-client"

interface PersonalInfo {
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  jobDescription?: string // Added optional job description for keyword matching
}

interface ResumeEditorProps {
  initialResumeData?: any
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ initialResumeData }) => {
  const [resumeData, setResumeData] = useState(
    initialResumeData || {
      personalInformation: {
        name: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
      },
      professionalSummary: "",
      workExperience: [],
      education: [],
      skills: [],
    },
  )

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingWorkDescription, setLoadingWorkDescription] = useState(false)
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)

  useEffect(() => {
    if (initialResumeData) {
      setResumeData(initialResumeData)
    }
  }, [initialResumeData])

  const handleInputChange = (section: string, field: string, value: string, index?: number) => {
    setResumeData((prevData) => {
      const newData = { ...prevData }

      if (section === "workExperience" && index !== undefined) {
        if (!newData.workExperience[index]) {
          newData.workExperience[index] = {}
        }
        newData.workExperience[index][field] = value
      } else if (section === "education" && index !== undefined) {
        if (!newData.education[index]) {
          newData.education[index] = {}
        }
        newData.education[index][field] = value
      } else if (section === "skills") {
        newData.skills = value.split(",").map((s) => s.trim())
      } else {
        newData[section][field] = value
      }

      return newData
    })
  }

  const handleAddWorkExperience = () => {
    setResumeData((prevData) => ({
      ...prevData,
      workExperience: [...prevData.workExperience, {}],
    }))
  }

  const handleRemoveWorkExperience = (index: number) => {
    setResumeData((prevData) => {
      const newWorkExperience = [...prevData.workExperience]
      newWorkExperience.splice(index, 1)
      return { ...prevData, workExperience: newWorkExperience }
    })
  }

  const handleAddEducation = () => {
    setResumeData((prevData) => ({
      ...prevData,
      education: [...prevData.education, {}],
    }))
  }

  const handleRemoveEducation = (index: number) => {
    setResumeData((prevData) => {
      const newEducation = [...prevData.education]
      newEducation.splice(index, 1)
      return { ...prevData, education: newEducation }
    })
  }

  const handleGenerateSummary = async () => {
    setLoadingSummary(true)
    try {
      const summary = await generateProfessionalSummary(resumeData)
      setResumeData((prevData) => ({ ...prevData, professionalSummary: summary }))
    } catch (error) {
      console.error("Error generating summary:", error)
      alert("Failed to generate summary. Please try again.")
    } finally {
      setLoadingSummary(false)
    }
  }

  const handleGenerateWorkDescription = async (index: number) => {
    setLoadingWorkDescription(true)
    try {
      const description = await generateWorkDescription(resumeData.workExperience[index])
      setResumeData((prevData) => {
        const newWorkExperience = [...prevData.workExperience]
        newWorkExperience[index].description = description
        return { ...prevData, workExperience: newWorkExperience }
      })
    } catch (error) {
      console.error("Error generating work description:", error)
      alert("Failed to generate work description. Please try again.")
    } finally {
      setLoadingWorkDescription(false)
    }
  }

  const handleGenerateSkillsSuggestions = async () => {
    setLoadingSkills(true)
    try {
      const suggestions = await generateSkillsSuggestions(resumeData)
      setSuggestedSkills(suggestions)
    } catch (error) {
      console.error("Error generating skills suggestions:", error)
      alert("Failed to generate skills suggestions. Please try again.")
    } finally {
      setLoadingSkills(false)
    }
  }

  const handleAddSuggestedSkill = (skill: string) => {
    setResumeData((prevData) => ({
      ...prevData,
      skills: [...prevData.skills, skill],
    }))
    setSuggestedSkills((prevSkills) => prevSkills.filter((s) => s !== skill))
  }

  return (
    <div>
      <h2>Resume Editor</h2>

      <h3>Personal Information</h3>
      <input
        type="text"
        placeholder="Name"
        value={resumeData.personalInformation.name}
        onChange={(e) => handleInputChange("personalInformation", "name", e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={resumeData.personalInformation.email}
        onChange={(e) => handleInputChange("personalInformation", "email", e.target.value)}
      />
      <input
        type="tel"
        placeholder="Phone"
        value={resumeData.personalInformation.phone}
        onChange={(e) => handleInputChange("personalInformation", "phone", e.target.value)}
      />
      <input
        type="url"
        placeholder="LinkedIn"
        value={resumeData.personalInformation.linkedin}
        onChange={(e) => handleInputChange("personalInformation", "linkedin", e.target.value)}
      />
      <input
        type="url"
        placeholder="GitHub"
        value={resumeData.personalInformation.github}
        onChange={(e) => handleInputChange("personalInformation", "github", e.target.value)}
      />
      <textarea
        placeholder="Job Description (Optional) - Used to generate work descriptions with relevant keywords"
        value={resumeData.personalInformation.jobDescription || ""}
        onChange={(e) => handleInputChange("personalInformation", "jobDescription", e.target.value)}
      />

      <h3>Professional Summary</h3>
      <textarea
        placeholder="Professional Summary"
        value={resumeData.professionalSummary}
        onChange={(e) => handleInputChange("professionalSummary", "professionalSummary", e.target.value)}
      />
      <button onClick={handleGenerateSummary} disabled={loadingSummary}>
        {loadingSummary ? "Generating..." : "Generate Summary"}
      </button>

      <h3>Work Experience</h3>
      {resumeData.workExperience.map((experience, index) => (
        <div key={index}>
          <h4>Experience {index + 1}</h4>
          <input
            type="text"
            placeholder="Job Title"
            value={experience.jobTitle || ""}
            onChange={(e) => handleInputChange("workExperience", "jobTitle", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="Company"
            value={experience.company || ""}
            onChange={(e) => handleInputChange("workExperience", "company", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="Location"
            value={experience.location || ""}
            onChange={(e) => handleInputChange("workExperience", "location", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="Start Date"
            value={experience.startDate || ""}
            onChange={(e) => handleInputChange("workExperience", "startDate", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="End Date"
            value={experience.endDate || ""}
            onChange={(e) => handleInputChange("workExperience", "endDate", e.target.value, index)}
          />
          <textarea
            placeholder="Description"
            value={experience.description || ""}
            onChange={(e) => handleInputChange("workExperience", "description", e.target.value, index)}
          />
          <button onClick={() => handleGenerateWorkDescription(index)} disabled={loadingWorkDescription}>
            {loadingWorkDescription ? "Generating..." : "Generate Description"}
          </button>
          <button onClick={() => handleRemoveWorkExperience(index)}>Remove</button>
        </div>
      ))}
      <button onClick={handleAddWorkExperience}>Add Work Experience</button>

      <h3>Education</h3>
      {resumeData.education.map((education, index) => (
        <div key={index}>
          <h4>Education {index + 1}</h4>
          <input
            type="text"
            placeholder="Institution"
            value={education.institution || ""}
            onChange={(e) => handleInputChange("education", "institution", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="Degree"
            value={education.degree || ""}
            onChange={(e) => handleInputChange("education", "degree", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="Start Date"
            value={education.startDate || ""}
            onChange={(e) => handleInputChange("education", "startDate", e.target.value, index)}
          />
          <input
            type="text"
            placeholder="End Date"
            value={education.endDate || ""}
            onChange={(e) => handleInputChange("education", "endDate", e.target.value, index)}
          />
          <button onClick={() => handleRemoveEducation(index)}>Remove</button>
        </div>
      ))}
      <button onClick={handleAddEducation}>Add Education</button>

      <h3>Skills</h3>
      <input
        type="text"
        placeholder="Skills (comma-separated)"
        value={resumeData.skills.join(", ")}
        onChange={(e) => handleInputChange("skills", "skills", e.target.value)}
      />
      <button onClick={handleGenerateSkillsSuggestions} disabled={loadingSkills}>
        {loadingSkills ? "Generating..." : "Suggest Skills"}
      </button>

      {suggestedSkills.length > 0 && (
        <div>
          <h4>Suggested Skills:</h4>
          <ul>
            {suggestedSkills.map((skill, index) => (
              <li key={index}>
                {skill}
                <button onClick={() => handleAddSuggestedSkill(skill)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ResumeEditor
