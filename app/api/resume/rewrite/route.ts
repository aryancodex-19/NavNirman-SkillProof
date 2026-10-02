import { NextRequest, NextResponse } from "next/server";
import { generateContentFromParts } from "@/lib/ai/gemini";
import {
  REWRITE_BULLET_PROMPT,
  REWRITE_SUMMARY_PROMPT,
  TAILOR_RESUME_PROMPT,
} from "@/lib/ai/prompts/resume";

export const maxDuration = 60;

// Custom toned-down, realistic system instructions to fix Issue 3
const PROFESSIONAL_TONED_DOWN_SYSTEM_INSTRUCTION = `You are an expert professional resume editor.
Your objective is to polish, refine, and tailor the resume text for a target job role.

CRITICAL INSTRUCTIONS:
- Tone down any unrealistic exaggeration, overhyped descriptions, or fake-sounding claims.
- Do NOT fabricate fake percentages, dollar amounts, or metrics. If a metric is provided in the input, keep it, but do not invent new ones.
- Maintain a balanced, authentic, and clear professional tone.
- Avoid clickbait-like adjectives or buzzwords (e.g. "disrupted", "revolutionized", "world-class", "unparalleled", "industry-changing").
- Emphasize solid, realistic engineering/management accomplishments using professional active verbs (e.g. "Designed", "Built", "Optimized", "Coordinate", "Implemented").
- Return the result in a clean JSON format matching the requested mode structure.

Mode structures:
For summary rewrite: Return JSON: { "summary": "string" }
For single bullet rewrite: Return JSON: { "bullet": "string" }
For full experience rewrite: Return JSON: { "experience": [ { "company": "...", "role": "...", "duration": "...", "bullets": ["..."] } ] }

Do not include markdown tags, code block fences, or any text other than the valid JSON payload.`;

export async function POST(req: NextRequest) {
  try {
    const { mode, bullet, summary, resumeData, targetRole } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: "Target role is required" }, { status: 400 });
    }

    let prompt = "";
    if (mode === "bullet") {
      if (!bullet) return NextResponse.json({ error: "Bullet text is required" }, { status: 400 });
      prompt = REWRITE_BULLET_PROMPT(bullet, targetRole);
    } else if (mode === "summary") {
      if (!summary) return NextResponse.json({ error: "Summary text is required" }, { status: 400 });
      prompt = REWRITE_SUMMARY_PROMPT(summary, targetRole);
    } else if (mode === "resume") {
      if (!resumeData) return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
      prompt = TAILOR_RESUME_PROMPT(resumeData, targetRole);
    } else {
      return NextResponse.json({ error: "Invalid rewrite mode" }, { status: 400 });
    }

    const responseText = await generateContentFromParts(
      [prompt],
      PROFESSIONAL_TONED_DOWN_SYSTEM_INSTRUCTION,
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
    console.error("Error in rewrite API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rewrite content" },
      { status: 500 }
    );
  }
}
