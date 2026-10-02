import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildJobReadinessReport } from "@/lib/skillproof";

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

    const { skills = [], jobDescription = "" } = body ?? {};

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    if (jobDescription.length > 100_000) {
      return NextResponse.json({ error: "Job description exceeds maximum allowed size (100KB)." }, { status: 400 });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: "Verified skill data is required." }, { status: 400 });
    }

    if (skills.length > 200) {
      return NextResponse.json({ error: "Skills payload exceeds maximum allowed items (200)." }, { status: 400 });
    }

    return NextResponse.json(buildJobReadinessReport(skills, jobDescription.trim()));
  } catch (error: any) {
    console.error("SkillProof job-match error:", error);
    const message = typeof error?.message === "string" ? error.message : "Failed to match skill requirements.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
