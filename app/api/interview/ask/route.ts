import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, difficulty, type } = await req.json();

    const prompt = `Generate an interview question for a ${role || "Software Engineer"} position.
Difficulty: ${difficulty || "Medium"}
Question type: ${type || "technical"} (can be: technical, behavioral, system design, situational)

Return ONLY valid JSON in this exact format:
{
  "question": "The interview question text",
  "type": "technical",
  "difficulty": "Medium",
  "hints": ["Hint 1", "Hint 2"],
  "expectedKeyPoints": ["Key concept 1", "Key concept 2", "Key concept 3"]
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert technical interviewer. Generate realistic, high-quality interview questions. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Interview question error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate question" }, { status: 500 });
  }
}
