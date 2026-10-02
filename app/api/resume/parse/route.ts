import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { generateContentFromParts } from "@/lib/ai/gemini";

export const maxDuration = 60;

const PARSE_SYSTEM_INSTRUCTION = `You are an expert resume parser. Given a PDF resume, extract structured data from it.
Return ONLY valid JSON with this exact schema (no markdown fences, no extra text):
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "summary": "string (professional summary or objective)",
  "skills": ["string array of skills"],
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
- Extract ALL experiences and education entries found.
- For bullets, use the actual accomplishment text from the resume. If none listed, create 1-2 bullets summarizing the role.
- If a field is not found, use an empty string or empty array as appropriate.
- skills should be individual skill names, not phrases.
- Do NOT wrap the response in markdown code fences.`;

export async function POST(req: NextRequest) {
  console.log("API /api/resume/parse called");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file uploaded");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("File received:", file.name, file.size);

    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Call Gemini with the PDF as inline data
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

    const rawResponse = await generateContentFromParts(
      parts,
      PARSE_SYSTEM_INSTRUCTION,
      "application/json"
    );

    console.log("Gemini raw response length:", rawResponse.length);

    // Parse the AI response
    let parsedData;
    try {
      // Clean up response in case it has markdown fences
      const cleaned = rawResponse
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      parsedData = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", rawResponse.substring(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 500 }
      );
    }

    // Normalize the parsed data to match our schema
    const normalizedData = {
      fullName: parsedData.fullName || parsedData.name || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      summary: parsedData.summary || parsedData.objective || "",
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
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
              : "Uploaded Resume",
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
        console.log("Resume auto-saved to database with id:", savedResumeId);
      }
    } catch (dbError) {
      // Don't fail the entire request if DB save fails — user still gets parsed data
      console.error("Failed to auto-save resume to database:", dbError);
    }

    return NextResponse.json({
      ...normalizedData,
      id: savedResumeId,
    });
  } catch (error: any) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}