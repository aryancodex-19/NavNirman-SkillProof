import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import {
  generateContentFromParts,
  isTransientError,
  extractTextFromPdfBuffer,
  extractSkillsFromText,
} from "@/lib/ai/gemini";
import Groq from "groq-sdk";

export const maxDuration = 60;

const PARSE_SYSTEM_INSTRUCTION = `You are an expert resume parser. Given a PDF resume or resume text, extract structured data from it.
Return ONLY valid JSON with this exact schema (no markdown fences, no extra text):
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "summary": "string (professional summary or objective)",
  "skills": ["string array of technical skills, languages, frameworks, and tools"],
  "experience": [
    {
      "company": "string",
      "role": "string (job title)",
      "duration": "string (e.g. Jan 2022 - Present)",
      "bullets": ["string array of accomplishments/responsibilities"]
    }
  ],
  "education": [
    {
      "school": "string (university/institution name)",
      "degree": "string (degree and major)",
      "year": "string (graduation year or date range)",
      "gpa": "string or empty string"
    }
  ]
}

Rules:
- Extract ALL technical skills, languages, libraries, databases, DevOps tools, and platforms mentioned anywhere in the resume.
- skills should be individual skill names (e.g. "React", "TypeScript", "Python", "Docker", "SQL"), not lengthy phrases.
- If skills are grouped in categories (e.g. Languages, Frameworks, Tools), combine them into a single flat array of strings.
- Extract ALL experiences and education entries found.
- For bullets, use the actual accomplishment text from the resume.
- If a field is not found, use an empty string or empty array.
- Do NOT wrap the response in markdown code fences.`;

/**
 * Normalizes skills from various LLM output formats (arrays, category objects, comma-separated strings)
 * and supplements with deterministic skill scanning from resume text/experience if sparse.
 */
export function normalizeExtractedSkills(rawSkills: any, otherData?: any, rawText?: string): string[] {
  const skillsSet = new Set<string>();

  function addSkill(s: any) {
    if (typeof s === "string") {
      // Split on commas, semicolons, or slashes if LLM returned comma-separated string
      const pieces = s.split(/[,;•|]/);
      for (const piece of pieces) {
        const cleaned = piece.trim().replace(/^[-*•]\s*/, "");
        if (cleaned.length > 0 && cleaned.length < 50) {
          skillsSet.add(cleaned);
        }
      }
    } else if (s && typeof s === "object") {
      if (typeof s.name === "string") addSkill(s.name);
      if (typeof s.skill === "string") addSkill(s.skill);
      if (typeof s.title === "string") addSkill(s.title);
    }
  }

  // 1. Process rawSkills
  if (Array.isArray(rawSkills)) {
    rawSkills.forEach(addSkill);
  } else if (rawSkills && typeof rawSkills === "object") {
    // LLM returned categorized object: { languages: [...], frameworks: [...] }
    Object.values(rawSkills).forEach((val) => {
      if (Array.isArray(val)) {
        val.forEach(addSkill);
      } else if (typeof val === "string") {
        addSkill(val);
      }
    });
  } else if (typeof rawSkills === "string") {
    addSkill(rawSkills);
  }

  // 2. Safety Net: If skills list is sparse, scan summary, experience, and raw text
  const textCorpusParts: string[] = [];
  if (typeof otherData?.summary === "string") textCorpusParts.push(otherData.summary);
  if (Array.isArray(otherData?.experience)) {
    for (const exp of otherData.experience) {
      if (exp.role) textCorpusParts.push(exp.role);
      if (Array.isArray(exp.bullets)) textCorpusParts.push(exp.bullets.join(" "));
    }
  }
  if (rawText) textCorpusParts.push(rawText);

  if (textCorpusParts.length > 0) {
    const scanned = extractSkillsFromText(textCorpusParts.join(" "));
    scanned.forEach((s) => skillsSet.add(s));
  }

  // 3. Deduplicate case-insensitively while preserving standard title casing
  const deduplicated: string[] = [];
  const lowerMap = new Set<string>();

  for (const skill of skillsSet) {
    const lower = skill.toLowerCase();
    if (!lowerMap.has(lower)) {
      lowerMap.add(lower);
      deduplicated.push(skill);
    }
  }

  return deduplicated;
}

export async function POST(req: NextRequest) {
  console.log("[Resume Parse API] POST received");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.warn("[Resume Parse API] No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`[Resume Parse API] Received file: ${file.name}, size: ${file.size} bytes`);

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded PDF file is empty (0 bytes). Please upload a valid resume PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Extract text from PDF buffer early for verification and safety baseline
    const extractedText = extractTextFromPdfBuffer(buffer);
    console.log(`[Resume Parse API] Extracted text length: ${extractedText.length} characters`);

    let rawResponse = "";
    let parsingProvider = "gemini";

    // 1. Primary Attempt: Gemini with bounded retries
    try {
      const parts = [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        {
          text: "Parse this resume PDF and extract all structured data. Return ONLY the JSON object as specified in your instructions.",
        },
      ];

      rawResponse = await generateContentFromParts(
        parts,
        PARSE_SYSTEM_INSTRUCTION,
        "application/json"
      );
    } catch (geminiErr: any) {
      console.warn("[Resume Parse API] Primary Gemini parser error:", geminiErr?.message || geminiErr);

      if (!isTransientError(geminiErr) && process.env.GEMINI_API_KEY) {
        throw geminiErr;
      }

      // 2. Secondary Fallback: Groq on extracted PDF text
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return NextResponse.json(
          {
            error:
              "The AI resume parser is temporarily unavailable due to high demand. Please try again in a few moments.",
          },
          { status: 503 }
        );
      }

      console.warn("[Resume Parse API] Attempting Groq fallback for resume parsing...");

      if (!extractedText || extractedText.trim().length < 15) {
        console.error("[Resume Parse API] PDF text extraction failed: no extractable text streams found.");
        return NextResponse.json(
          {
            error:
              "PDF text extraction failed: The uploaded file appears to be a scanned image or contains unreadable text. Please upload a text-selectable PDF.",
          },
          { status: 422 }
        );
      }

      const groq = new Groq({ apiKey: groqApiKey });
      const groqCompletion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: PARSE_SYSTEM_INSTRUCTION },
          {
            role: "user",
            content: `Parse this resume text and extract all structured data according to the schema:\n\n${extractedText}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      rawResponse = groqCompletion.choices[0]?.message?.content || "";
      parsingProvider = "groq";
    }

    console.log(`[Resume Parse API] Raw response received via ${parsingProvider}, length: ${rawResponse.length}`);

    // Parse the AI response
    let parsedData: any = {};
    try {
      const cleaned = rawResponse
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[Resume Parse API] Failed to parse AI response as JSON. Falling back to text scanner.");
      // Fall back gracefully to structured extraction directly from extracted text
      parsedData = {
        fullName: "",
        summary: "",
        experience: [],
        education: [],
        skills: [],
      };
    }

    // Normalize and supplement skills
    const normalizedSkills = normalizeExtractedSkills(
      parsedData.skills || parsedData.technicalSkills || parsedData.keySkills,
      parsedData,
      extractedText
    );

    console.log(`[Resume Parse API] Final normalized skill count: ${normalizedSkills.length}`);

    // Validate and normalize the parsed data to match our schema
    const normalizedData = {
      fullName: typeof parsedData.fullName === "string" ? parsedData.fullName : parsedData.name || "",
      email: typeof parsedData.email === "string" ? parsedData.email : "",
      phone: typeof parsedData.phone === "string" ? parsedData.phone : "",
      summary: typeof parsedData.summary === "string" ? parsedData.summary : parsedData.objective || "",
      skills: normalizedSkills,
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience.map((exp: any) => ({
            company: exp.company || "",
            role: exp.role || exp.title || exp.position || "",
            duration: exp.duration || exp.dates || exp.period || "",
            bullets: Array.isArray(exp.bullets)
              ? exp.bullets
              : Array.isArray(exp.achievements)
              ? exp.achievements
              : Array.isArray(exp.responsibilities)
              ? exp.responsibilities
              : [""],
          }))
        : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education.map((edu: any) => ({
            school: edu.school || edu.institution || edu.university || "",
            degree: edu.degree || edu.major || "",
            year: edu.year || edu.graduationYear || edu.dates || "",
            gpa: edu.gpa || "",
          }))
        : [],
    };

    // Auto-save to database if user is authenticated
    let savedResumeId: string | null = null;

    try {
      const { userId: clerkId } = await auth();

      if (clerkId) {
        let user = await prisma.user.findUnique({
          where: { clerkId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              clerkId,
              email: normalizedData.email || "placeholder@email.com",
              name: normalizedData.fullName || "User",
            },
          });
        }

        const savedResume = await prisma.resume.create({
          data: {
            userId: user.id,
            title: normalizedData.fullName
              ? `${normalizedData.fullName}'s Resume`
              : file.name || "Uploaded Resume",
            fullName: normalizedData.fullName,
            email: normalizedData.email,
            phone: normalizedData.phone,
            summary: normalizedData.summary,
            skills: JSON.stringify(normalizedData.skills),
            experience: JSON.stringify(normalizedData.experience),
            education: JSON.stringify(normalizedData.education),
          },
        });

        savedResumeId = savedResume.id;
        console.log(`[Resume Parse API] Resume saved to DB with ID: ${savedResumeId}`);
      }
    } catch (dbError) {
      console.error("[Resume Parse API] DB save warning:", dbError);
    }

    return NextResponse.json({
      ...normalizedData,
      id: savedResumeId,
      provider: parsingProvider,
      warning:
        normalizedSkills.length === 0
          ? "No recognizable technical skills found in resume text. Please ensure your technical skills and tools are listed."
          : undefined,
    });
  } catch (error: any) {
    console.error("[Resume Parse API] Parse error:", error);
    const isTransient = isTransientError(error);
    return NextResponse.json(
      {
        error: isTransient
          ? "The AI service is temporarily experiencing high demand (503). Please try again in a few moments."
          : error.message || "Failed to parse resume",
      },
      { status: isTransient ? 503 : 500 }
    );
  }
}