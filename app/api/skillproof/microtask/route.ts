import { NextRequest, NextResponse } from "next/server";
import { generateMicroTask } from "@/lib/skillproof";

export async function POST(req: NextRequest) {
  try {
    const { skill = "" } = await req.json();

    if (!skill || !String(skill).trim()) {
      return NextResponse.json({ error: "Skill gap is required." }, { status: 400 });
    }

    return NextResponse.json(generateMicroTask(String(skill)));
  } catch (error: any) {
    console.error("SkillProof microtask error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate a micro-task." },
      { status: 500 }
    );
  }
}
