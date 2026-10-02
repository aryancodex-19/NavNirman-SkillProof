import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, currentText, role, skills } = await req.json();

    if (!type) return NextResponse.json({ error: "Optimization type is required" }, { status: 400 });

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "headline") {
      systemPrompt = "You are a LinkedIn optimization expert. Generate compelling professional headlines that attract recruiters. Return only valid JSON.";
      userPrompt = `Generate 5 different LinkedIn professional headlines for:
Role: ${role || "Software Engineer"}
Skills: ${skills || "JavaScript, React, Node.js"}

Return ONLY valid JSON:
{
  "headlines": [
    "Headline option 1",
    "Headline option 2",
    "Headline option 3",
    "Headline option 4",
    "Headline option 5"
  ]
}

Make headlines specific, keyword-rich, and compelling (under 220 characters each).`;
    } else if (type === "about") {
      systemPrompt = "You are a LinkedIn profile writing expert. Write compelling About sections that tell professional stories. Return only valid JSON.";
      userPrompt = `Rewrite this LinkedIn About section to be more compelling and keyword-optimized for a ${role || "Software Engineer"} role.

Current About section: "${currentText || "I am a software developer with experience in web development."}"
Target Role: ${role || "Software Engineer"}
Skills: ${skills || "JavaScript, React, Node.js"}

Return ONLY valid JSON:
{
  "rewritten": "The rewritten About section (150-300 words, first-person, conversational yet professional, with key achievements and a call to action)",
  "tips": ["Tip 1 about what was improved", "Tip 2", "Tip 3"]
}`;
    } else if (type === "skills") {
      systemPrompt = "You are a LinkedIn skills optimization expert. Suggest relevant in-demand skills. Return only valid JSON.";
      userPrompt = `Suggest 15 LinkedIn skills for a ${role || "Software Engineer"} with these existing skills: ${skills || "JavaScript, React"}.

Return ONLY valid JSON:
{
  "suggestedSkills": [
    {"skill": "Skill Name", "importance": "High", "reason": "Why this skill matters for the role"},
    ...15 items...
  ]
}

Focus on skills that appear on LinkedIn's endorsement system and are searched by recruiters.`;
    } else {
      return NextResponse.json({ error: "Invalid optimization type" }, { status: 400 });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("LinkedIn optimize error:", error);
    return NextResponse.json({ error: error.message || "Failed to optimize" }, { status: 500 });
  }
}
