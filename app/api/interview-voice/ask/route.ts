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
      targetRole,
      skills,
      previousQuestions = [],
      previousAnswers = [],
      questionNumber = 1,
      lastEvaluation,
    } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: "Target role is required" }, { status: 400 });
    }

    // Determine difficulty
    const difficulty = Math.min(5, Math.max(1, Math.ceil(questionNumber / 2)));
    const difficultyLabel =
      difficulty <= 1 ? "easy warm-up"
        : difficulty === 2 ? "easy-to-medium"
        : difficulty === 3 ? "medium"
        : difficulty === 4 ? "medium-to-hard"
        : "hard, advanced";

    // Determine question type rotation
    const types = ["technical", "behavioral", "situational", "technical", "behavioral", "technical", "situational", "technical"];
    const questionType = types[(questionNumber - 1) % types.length];

    const previousQsText = previousQuestions.length > 0
      ? `\n\nPrevious questions asked:\n${previousQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`
      : "";

    const lastAnswerContext = previousAnswers.length > 0 && lastEvaluation
      ? `\n\nLast answer summary: "${previousAnswers[previousAnswers.length - 1].substring(0, 200)}"\nLast evaluation: ${JSON.stringify(lastEvaluation)}`
      : "";

    const weakAreaContext = lastEvaluation?.improvements?.length > 0
      ? `\nFocus on areas they struggled with: ${lastEvaluation.improvements.join(", ")}`
      : "";

    const systemPrompt = `You are a senior technical interviewer conducting a real interview for a ${targetRole} position. 
You must generate ONE interview question that:
- Is ${difficultyLabel} difficulty (difficulty level ${difficulty}/5)
- Is a ${questionType} question
- Is completely different from previous questions
- Adapts based on the candidate's performance${weakAreaContext}
- Feels natural and conversational

Skills to assess: ${Array.isArray(skills) ? skills.join(", ") : skills || "general software engineering"}

Return ONLY valid JSON in this EXACT format (no markdown, no extra text):
{
  "question": "Your question text here",
  "questionType": "${questionType}",
  "difficulty": ${difficulty},
  "hint": "What a strong answer should cover (for internal use)",
  "followUpTopics": ["topic1", "topic2"]
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate question #${questionNumber} for a ${targetRole} interview.${previousQsText}${lastAnswerContext}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    if (!parsed.question) {
      // Fallback question
      const fallbackQuestions: Record<string, string[]> = {
        technical: [
          `Can you explain how you would design a scalable system for a ${targetRole} role?`,
          `What data structures would you use to optimize performance in your typical ${targetRole} work?`,
        ],
        behavioral: [
          "Tell me about a challenging project you worked on and how you overcame the obstacles.",
          "Describe a time when you had to learn a new technology quickly. How did you approach it?",
        ],
        situational: [
          "If you joined a team with a critical production bug and no documentation, how would you handle it?",
        ],
      };
      const fallbacks = fallbackQuestions[questionType] || fallbackQuestions.technical;
      parsed = {
        question: fallbacks[questionNumber % fallbacks.length],
        questionType,
        difficulty,
        hint: "Look for clear problem-solving approach",
        followUpTopics: [],
      };
    }

    return NextResponse.json({
      question: parsed.question,
      questionType: parsed.questionType || questionType,
      difficulty: parsed.difficulty || difficulty,
      hint: parsed.hint || "",
      followUpTopics: parsed.followUpTopics || [],
    });
  } catch (error: any) {
    console.error("Voice interview ask error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
