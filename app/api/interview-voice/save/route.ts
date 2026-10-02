import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      targetRole,
      skills,
      questions,
      answers,
      evaluations,
      durationSecs,
    } = await req.json();

    if (!questions || !answers || questions.length === 0) {
      return NextResponse.json({ error: "Interview data required" }, { status: 400 });
    }

    // Get or create user
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({
        data: { clerkId, email: "user@careeros.app", name: "User" },
      });
    }

    // Calculate overall score
    const scores = evaluations.map((e: any) => e.overallScore || 0);
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

    // Generate final AI summary report
    const summaryPrompt = `You are an expert interviewer. Based on this completed ${targetRole} interview, generate a comprehensive final report.

Interview Summary:
${questions.map((q: any, i: number) => `
Q${i + 1} [${q.questionType}, Difficulty ${q.difficulty}/5]: "${q.text}"
Answer: "${answers[i] || "No answer"}"
Scores: Technical=${evaluations[i]?.technicalScore || 0}, Communication=${evaluations[i]?.communicationScore || 0}, Confidence=${evaluations[i]?.confidenceScore || 0}
`).join("\n")}

Overall Score: ${overallScore}/100

Return ONLY valid JSON:
{
  "overallScore": ${overallScore},
  "grade": "<A+/A/B+/B/C+/C/D based on score>",
  "summary": "<3-4 sentence overall assessment>",
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "topImprovements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "studyTopics": ["<topic to study 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
  "readyForInterview": <true if score >= 70>,
  "nextSteps": "<2-3 specific actionable next steps>",
  "hiringRecommendation": "<Strong Hire / Hire / Borderline / No Hire>"
}`;

    const summaryRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert hiring manager. Return only valid JSON. No markdown." },
        { role: "user", content: summaryPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1024,
    });

    let finalReport: any = {};
    try {
      finalReport = JSON.parse(summaryRes.choices[0]?.message?.content || "{}");
    } catch {
      finalReport = {
        overallScore,
        grade: overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B" : overallScore >= 60 ? "C" : "D",
        summary: "Interview completed. Review the individual question feedback for details.",
        topStrengths: ["Attempted all questions", "Showed some domain knowledge"],
        topImprovements: ["Practice explaining concepts more clearly", "Add more specific examples"],
        studyTopics: ["System Design", "Data Structures", "Behavioral Interview techniques"],
        readyForInterview: overallScore >= 70,
        nextSteps: "Practice more mock interviews and study the suggested topics.",
        hiringRecommendation: overallScore >= 80 ? "Hire" : overallScore >= 70 ? "Borderline" : "No Hire",
      };
    }

    // Save to database
    const db = prisma as any;
    const saved = await db.voiceInterview.create({
      data: {
        userId: user.id,
        targetRole: targetRole || "General",
        skills: JSON.stringify(Array.isArray(skills) ? skills : []),
        questions: JSON.stringify(questions),
        answers: JSON.stringify(answers),
        evaluations: JSON.stringify(evaluations),
        overallScore,
        finalReport: JSON.stringify(finalReport),
        durationSecs: durationSecs || 0,
      },
    });

    return NextResponse.json({
      success: true,
      id: saved.id,
      finalReport,
      overallScore,
    });
  } catch (error: any) {
    console.error("Voice interview save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ interviews: [] });

    const db = prisma as any;
    const interviews = await db.voiceInterview.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ interviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
