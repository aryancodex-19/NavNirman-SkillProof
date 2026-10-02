import { NextRequest, NextResponse } from "next/server";
import {
  analyzeGitHubForSkills,
  buildJobReadinessReport,
  computeOverallCoverage,
  extractSkillKeywords,
} from "@/lib/skillproof";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText = "", githubUsername = "", jobDescription = "", resumeData } = body ?? {};

    if (!githubUsername || !String(githubUsername).trim()) {
      return NextResponse.json(
        { error: "GitHub username is required for evidence verification." },
        { status: 400 }
      );
    }

    const sourceText = [
      typeof resumeText === "string" ? resumeText : "",
      typeof resumeData?.summary === "string" ? resumeData.summary : "",
      Array.isArray(resumeData?.skills) ? resumeData.skills.join(" ") : "",
      Array.isArray(resumeData?.experience) ? resumeData.experience.map((exp: any) => `${exp.role || ""} ${exp.company || ""} ${(exp.bullets || []).join(" ")}`).join(" ") : "",
    ].join(" ");

    const claimedSkills = extractSkillKeywords(sourceText, Array.isArray(resumeData?.skills) ? resumeData.skills : []);

    const githubAnalysis = await analyzeGitHubForSkills(String(githubUsername).trim(), claimedSkills);

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

    const jobReport = jobDescription && String(jobDescription).trim()
      ? buildJobReadinessReport(finalSkills, String(jobDescription))
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
    return NextResponse.json(
      { error: error?.message || "Failed to verify skills against GitHub evidence." },
      { status: 500 }
    );
  }
}
