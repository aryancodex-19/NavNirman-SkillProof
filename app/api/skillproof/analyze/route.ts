import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  analyzeGitHubForSkills,
  buildJobReadinessReport,
  computeOverallCoverage,
  extractSkillKeywords,
} from "@/lib/skillproof";

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

    const { resumeText = "", githubUsername = "", jobDescription = "", resumeData } = body ?? {};

    if (!githubUsername || typeof githubUsername !== "string" || !githubUsername.trim()) {
      return NextResponse.json(
        { error: "GitHub username is required for evidence verification." },
        { status: 400 }
      );
    }

    const cleanUsername = githubUsername.trim();
    if (cleanUsername.length > 100 || !/^[A-Za-z0-9-]+$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "GitHub username format is invalid." },
        { status: 400 }
      );
    }

    if (typeof resumeText === "string" && resumeText.length > 500_000) {
      return NextResponse.json(
        { error: "Resume text exceeds maximum allowed size (500KB)." },
        { status: 400 }
      );
    }

    if (typeof jobDescription === "string" && jobDescription.length > 100_000) {
      return NextResponse.json(
        { error: "Job description exceeds maximum allowed size (100KB)." },
        { status: 400 }
      );
    }

    const sourceText = [
      typeof resumeText === "string" ? resumeText : "",
      typeof resumeData?.summary === "string" ? resumeData.summary : "",
      Array.isArray(resumeData?.skills) ? resumeData.skills.join(" ") : "",
      Array.isArray(resumeData?.experience) ? resumeData.experience.map((exp: any) => `${exp?.role || ""} ${exp?.company || ""} ${(exp?.bullets || []).join(" ")}`).join(" ") : "",
    ].join(" ");

    const claimedSkills = extractSkillKeywords(sourceText, Array.isArray(resumeData?.skills) ? resumeData.skills : []);

    const githubAnalysis = await analyzeGitHubForSkills(cleanUsername, claimedSkills);

    const finalSkills = githubAnalysis.skills.length > 0 ? githubAnalysis.skills : claimedSkills.map((skill) => ({
      skill,
      claimedLevel: "Resume claim",
      source: "resume" as const,
      verdict: "CLAIMED_ONLY" as const,
      evidenceStrength: "WEAK" as const,
      evidenceSummary: ["No public repository evidence found for this skill."],
      evidenceLinks: [{ label: "No evidence found", url: "#" }],
      whatItSupports: "No public evidence was found.",
      whatItDoesNotProve: "This skill remains unverified based on public repository evidence.",
      repositoryCount: 0,
      repositoryEvidence: [],
    }));

    const jobReport = jobDescription && typeof jobDescription === "string" && jobDescription.trim()
      ? buildJobReadinessReport(finalSkills, jobDescription.trim())
      : undefined;

    return NextResponse.json({
      githubProfile: githubAnalysis.profile,
      claimedSkills,
      skills: finalSkills,
      overallCoverage: computeOverallCoverage(finalSkills),
      jobReport,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("SkillProof analyze error:", error);
    const message = typeof error?.message === "string" ? error.message : "Failed to verify skills against GitHub evidence.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
