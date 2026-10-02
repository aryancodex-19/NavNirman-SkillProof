import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import {
  generateContentFromParts,
  isTransientError,
  extractTextFromPdfBuffer,
  extractSkillsFromText,
  GROQ_PRIMARY_MODEL,
  GROQ_FALLBACK_MODEL,
} from "@/lib/ai/gemini";
import Groq from "groq-sdk";
// pdf-parse is a CommonJS module — use require() to avoid TS1192
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer, opts?: any) => Promise<{ text: string; numpages: number }> =
  require("pdf-parse");

/**
 * Extracts readable text from a PDF buffer using pdf-parse (primary) with
 * our custom extractTextFromPdfBuffer as a secondary fallback.
 */
async function robustExtractPdfText(buffer: Buffer): Promise<string> {
  // Primary: pdf-parse (handles standard text-selectable PDFs much better)
  try {
    const data = await pdfParse(buffer, { max: 0 } as any);
    if (data.text && data.text.trim().length > 50) {
      return data.text.trim();
    }
  } catch {
    // pdf-parse failed – fall through to secondary
  }

  // Secondary: custom stream extractor (handles some edge-case PDF formats)
  const customText = extractTextFromPdfBuffer(buffer);
  return customText;
}

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
- Extract ALL technical skills, languages, libraries, databases, DevOps tools, engineering concepts (OOP, Data Structures, Algorithms, Testing), and developer platforms (VS Code, Figma, Docker, Git) mentioned anywhere in the resume.
- skills should be individual skill names (e.g. "Java", "Python", "OOP", "AI/ML", "VS Code", "Figma", "React", "Docker"), not lengthy phrases.
- If skills are grouped in categories (e.g. Languages, Frameworks, Tools), combine them into a single flat array of strings.
- Extract ALL experiences and education entries found.
- For bullets, use the actual accomplishment text from the resume.
- If a field is not found, use an empty string or empty array.
- Do NOT wrap the response in markdown code fences.`;

export const CANONICAL_SKILL_MAP: Record<string, string> = {
  react: "React",
  "react.js": "React",
  reactjs: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  vue: "Vue.js",
  "vue.js": "Vue.js",
  vuejs: "Vue.js",
  node: "Node.js",
  "node.js": "Node.js",
  nodejs: "Node.js",
  express: "Express.js",
  "express.js": "Express.js",
  expressjs: "Express.js",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  java: "Java",
  "c++": "C++",
  cpp: "C++",
  cplusplus: "C++",
  "c#": "C#",
  csharp: "C#",
  c: "C",
  ".net": ".NET",
  dotnet: ".NET",
  "net core": ".NET",
  "asp.net": ".NET",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  scala: "Scala",
  r: "R",
  sql: "SQL",
  html: "HTML",
  html5: "HTML",
  css: "CSS",
  css3: "CSS",
  tailwind: "Tailwind CSS",
  "tailwind css": "Tailwind CSS",
  tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap",
  redux: "Redux",
  zustand: "Zustand",
  graphql: "GraphQL",
  "rest api": "REST API",
  "restful api": "REST API",
  "restful apis": "REST API",
  apis: "REST API",
  "api development": "API Development",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",
  aws: "AWS",
  "amazon web services": "AWS",
  gcp: "GCP",
  "google cloud": "GCP",
  "google cloud platform": "GCP",
  azure: "Azure",
  "microsoft azure": "Azure",
  "ci/cd": "CI/CD",
  "github actions": "GitHub Actions",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  linux: "Linux",
  terraform: "Terraform",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  sqlite: "SQLite",
  prisma: "Prisma",
  supabase: "Supabase",
  firebase: "Firebase",
  oop: "OOP",
  oops: "OOP",
  "object-oriented programming": "OOP",
  "object oriented programming": "OOP",
  "ai/ml": "AI/ML",
  "ai & ml": "AI/ML",
  "ai / ml": "AI/ML",
  "machine learning": "Machine Learning",
  "deep learning": "Deep Learning",
  "data analysis": "Data Analysis",
  "data science": "Data Science",
  "artificial intelligence": "AI/ML",
  "vs code": "VS Code",
  vscode: "VS Code",
  "visual studio code": "VS Code",
  figma: "Figma",
  "data structures": "Data Structures",
  algorithms: "Algorithms",
  testing: "Testing",
  "unit testing": "Testing",
  "integration testing": "Testing",
  tdd: "Testing",
  flutter: "Flutter",
  "react native": "React Native",
};

/**
 * Normalizes skills from various LLM output formats (arrays, category objects, comma-separated strings)
 * and supplements with deterministic skill scanning from resume text/experience if sparse.
 */
export function normalizeExtractedSkills(rawSkills: any, otherData?: any, rawText?: string): string[] {
  const skillsSet = new Set<string>();

  function canonicalize(skillName: string): string {
    const trimmed = skillName.trim().replace(/^[-*•]\s*/, "");
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    return CANONICAL_SKILL_MAP[lower] || trimmed;
  }

  function addSkill(s: any) {
    if (typeof s === "string") {
      const pieces = s.split(/[,;•|]/);
      for (const piece of pieces) {
        const canonical = canonicalize(piece);
        if (canonical.length > 0 && canonical.length < 50) {
          skillsSet.add(canonical);
        }
      }
    } else if (s && typeof s === "object") {
      if (typeof s.name === "string") addSkill(s.name);
      if (typeof s.skill === "string") addSkill(s.skill);
      if (typeof s.title === "string") addSkill(s.title);
    }
  }

  // 1. Process rawSkills from AI or input
  if (Array.isArray(rawSkills)) {
    rawSkills.forEach(addSkill);
  } else if (rawSkills && typeof rawSkills === "object") {
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

  // 2. Safety Net: Deterministic text scan across summary, experience, and raw text
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
    scanned.forEach((s) => skillsSet.add(canonicalize(s)));
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

    // Extract text from PDF buffer — pdf-parse primary, custom fallback
    const extractedText = await robustExtractPdfText(buffer);
    console.log(`[Resume Parse API] Extracted text length: ${extractedText.length} characters`);

    // Detect image-only / scanned PDFs: need at least 80 real word characters
    const wordCharCount = extractedText.replace(/[^a-zA-Z]/g, "").length;
    if (wordCharCount < 80) {
      return NextResponse.json(
        {
          error:
            "This PDF appears to be image-based (e.g. exported from Canva or a design tool) and contains no selectable text. " +
            "Please re-save your resume from Microsoft Word, Google Docs, or a text-based PDF editor, then upload again.",
        },
        { status: 422 }
      );
    }

    let rawResponse = "";
    let parsingProvider = "gemini";

    // 1. Primary Attempt: Gemini with bounded retries
    let aiSucceeded = false;

    if (process.env.GEMINI_API_KEY) {
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
        aiSucceeded = true;
      } catch (geminiErr: any) {
        console.warn("[Resume Parse API] Primary Gemini parser error:", geminiErr?.message || geminiErr);
      }
    }

    // 2. Secondary Fallback: Groq on extracted PDF text
    if (!aiSucceeded && process.env.GROQ_API_KEY) {
      try {
        console.warn("[Resume Parse API] Attempting Groq fallback for resume parsing...");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        // Truncate to avoid context-window overflow that causes empty model output
        const truncatedText = extractedText.slice(0, 14000);
        const groqMessages = [
          { role: "system" as const, content: PARSE_SYSTEM_INSTRUCTION },
          {
            role: "user" as const,
            content: `Parse this resume text and extract all structured data according to the schema:\n\n${truncatedText}`,
          },
        ];

        for (const model of [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL]) {
          try {
            const groqCompletion = await groq.chat.completions.create({
              model,
              messages: groqMessages,
              temperature: 0.1,
              response_format: { type: "json_object" },
            });
            const content = groqCompletion.choices[0]?.message?.content;
            if (content) {
              rawResponse = content;
              parsingProvider = `groq:${model}`;
              aiSucceeded = true;
              break;
            }
            console.warn(`[Resume Parse API] Groq model ${model} returned empty content, trying fallback model...`);
          } catch (modelErr: any) {
            console.warn(`[Resume Parse API] Groq model ${model} error: ${modelErr?.message}`);
            if (model === GROQ_FALLBACK_MODEL) {
              console.error("[Resume Parse API] Both Groq models failed.");
            }
          }
        }
      } catch (groqErr) {
        console.error("[Resume Parse API] Groq fallback failed:", groqErr);
      }
    }

    // Parse the AI response if AI succeeded
    let parsedData: any = {};
    if (aiSucceeded && rawResponse) {
      try {
        const cleaned = rawResponse
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        parsedData = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("[Resume Parse API] Failed to parse AI JSON. Utilizing deterministic parser.");
      }
    }

    // If AI failed or produced no structured data, utilize deterministic fallback extraction directly from text
    if (!parsedData || (!parsedData.fullName && !parsedData.skills)) {
      parsingProvider = "deterministic-fallback";
      const lines = extractedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

      parsedData = {
        fullName: lines[0] && lines[0].length < 50 ? lines[0] : "",
        email: emailMatch ? emailMatch[0] : "",
        phone: phoneMatch ? phoneMatch[0] : "",
        summary: lines.slice(1, 4).join(" "),
        experience: [],
        education: [],
        skills: extractSkillsFromText(extractedText),
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