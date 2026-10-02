import { NextRequest, NextResponse } from "next/server";
import { buildJobReadinessReport } from "@/lib/skillproof";

export async function POST(req: NextRequest) {
  try {
    const { skills = [], jobDescription = "" } = await req.json();

    if (!jobDescription || !String(jobDescription).trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: "Verified skill data is required." }, { status: 400 });
    }

    return NextResponse.json(buildJobReadinessReport(skills, String(jobDescription)));
  } catch (error: any) {
    console.error("SkillProof job-match error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to match skill requirements." },
      { status: 500 }
    );
  }
}
