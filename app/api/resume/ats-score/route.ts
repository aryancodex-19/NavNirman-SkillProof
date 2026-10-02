import { NextRequest, NextResponse } from "next/server";
import { generateContentFromParts } from "@/lib/ai/gemini";
import { ATS_SCORE_SYSTEM_INSTRUCTION, ATS_SCORE_PROMPT } from "@/lib/ai/prompts/resume";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { resumeData, jobDescription } = await req.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: "Resume data and job description are both required" },
        { status: 400 }
      );
    }

    const prompt = ATS_SCORE_PROMPT(resumeData, jobDescription);

    const responseText = await generateContentFromParts(
      [prompt],
      ATS_SCORE_SYSTEM_INSTRUCTION,
      "application/json"
    );

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const result = JSON.parse(cleanJson);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in ATS score API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate ATS score" },
      { status: 500 }
    );
  }
}
