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

    const { question, answer, role, saveSession, sessionData } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const prompt = `You are evaluating a candidate's interview answer for a ${role || "Software Engineer"} position.

Question: "${question}"

Candidate's Answer: "${answer}"

Evaluate this answer and return ONLY valid JSON in this exact format:
{
  "overallScore": 75,
  "confidence": 70,
  "clarity": 80,
  "relevance": 75,
  "grammar": 85,
  "feedback": "Detailed constructive feedback about the answer (2-3 sentences)",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "sampleAnswer": "A brief example of what a strong answer might include"
}

Scoring guide (0-100):
- overallScore: overall quality of the answer
- confidence: how confident and assertive the answer sounds
- clarity: how clear and well-structured the answer is
- relevance: how relevant the answer is to the question
- grammar: grammatical correctness and professionalism`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert interview evaluator. Be fair, constructive, and specific. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const evaluation = JSON.parse(content);

    // Save session if requested
    if (saveSession && sessionData) {
      try {
        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (user) {
          await (prisma as any).interviewSession.create({
            data: {
              userId: user.id,
              role: role || "General",
              questions: JSON.stringify(sessionData.questions || [question]),
              answers: JSON.stringify(sessionData.answers || [answer]),
              scores: JSON.stringify(sessionData.scores || [evaluation]),
            },
          });
        }
      } catch (dbErr) {
        console.error("Failed to save interview session:", dbErr);
      }
    }

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("Interview evaluate error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate answer" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ sessions: [] });

    const sessions = await (prisma as any).interviewSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
