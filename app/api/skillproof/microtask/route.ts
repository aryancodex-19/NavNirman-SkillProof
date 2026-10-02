import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateMicroTask } from "@/lib/skillproof";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { skill = "" } = body ?? {};

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      return NextResponse.json({ error: "Skill gap is required." }, { status: 400 });
    }

    const cleanSkill = skill.trim();
    if (cleanSkill.length > 100) {
      return NextResponse.json({ error: "Skill name is too long." }, { status: 400 });
    }

    return NextResponse.json(generateMicroTask(cleanSkill));
  } catch (error: any) {
    console.error("SkillProof microtask error:", error);
    const message = typeof error?.message === "string" ? error.message : "Failed to generate a micro-task.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
