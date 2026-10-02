import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      question,
      answer,
      questionNumber,
      targetRole,
      skills,
      questionType = "technical",
      difficulty = 1,
      isLastQuestion = false,
    } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const skillsText = Array.isArray(skills) ? skills.join(", ") : skills || "general engineering";

    const systemPrompt = `You are an expert technical interviewer evaluating a candidate for a ${targetRole} position.
Evaluate the answer with deep insight — be fair but honest. This is a real interview scenario.

The candidate has these skills: ${skillsText}
Question type: ${questionType}, Difficulty: ${difficulty}/5

Provide evaluation in ONLY valid JSON (no markdown, no extra text):
{
  "technicalScore": <0-100 integer, based on technical accuracy and depth>,
  "communicationScore": <0-100 integer, based on clarity, structure, and conciseness>,
  "confidenceScore": <0-100 integer, based on decisiveness, completeness, lack of hesitation>,
  "overallScore": <0-100 integer, weighted average>,
  "feedback": "<2-3 sentences of specific, actionable feedback>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific area to improve 1>", "<specific area to improve 2>"],
  "followUpQuestion": "<A natural follow-up question that probes deeper on their answer, OR empty string if this is the last question>",
  "keyInsight": "<One key observation about this answer in 1 sentence>",
  "wouldHire": <true if score >= 70, false otherwise>
}

Scoring guidelines:
- Technical (0-100): Does it show real understanding? Are concepts correct? Any errors?
- Communication (0-100): Is it well-structured? Clear? To the point?
- Confidence (0-100): Does it show certainty? Cover edge cases? Or is it vague and unsure?
- Be strict for senior roles, more lenient for junior roles based on difficulty level.`;

    const userPrompt = `QUESTION: "${question}"

CANDIDATE'S ANSWER: "${answer}"

Is this the last question: ${isLastQuestion}

Evaluate this answer now.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 768,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let evaluation: any = {};
    try { evaluation = JSON.parse(content); } catch { evaluation = {}; }

    // Ensure all fields exist with fallbacks
    const result = {
      technicalScore: evaluation.technicalScore ?? 60,
      communicationScore: evaluation.communicationScore ?? 60,
      confidenceScore: evaluation.confidenceScore ?? 60,
      overallScore: evaluation.overallScore ?? 60,
      feedback: evaluation.feedback ?? "Good attempt. Keep practicing to improve depth and clarity.",
      strengths: evaluation.strengths ?? ["Attempted the question"],
      improvements: evaluation.improvements ?? ["Add more specific examples", "Increase technical depth"],
      followUpQuestion: isLastQuestion ? "" : (evaluation.followUpQuestion ?? ""),
      keyInsight: evaluation.keyInsight ?? "The answer shows basic understanding.",
      wouldHire: evaluation.wouldHire ?? (evaluation.overallScore >= 70),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Voice interview evaluate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
