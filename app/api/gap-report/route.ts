import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { computeGapReport, GapReport } from "@/lib/gap-report/engine";
import { generateContent } from "@/lib/ai/gemini";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ gapReport: null });

    const db = prisma as any;
    const gitHubRecord = await db.gitHubAnalysis.findUnique({ where: { userId: user.id } });
    const latestGapReport = gitHubRecord?.analysisData?.latestGapReport || null;
    const latestAssessment = gitHubRecord?.analysisData?.latestAssessment || null;

    return NextResponse.json({
      gapReport: latestGapReport,
      hasAssessment: !!latestAssessment,
      targetRole: user.targetRole || "Full Stack Engineer",
    });
  } catch (error: any) {
    console.error("GET /api/gap-report error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch gap report" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { jobDescription } = body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 30) {
      return NextResponse.json(
        { error: "Please paste a job description of at least 30 characters." },
        { status: 400 }
      );
    }

    if (jobDescription.length > 15000) {
      return NextResponse.json(
        { error: "Job description is too long (max 15,000 characters). Please paste the most relevant sections." },
        { status: 400 }
      );
    }

    // Load existing assessment from DB
    const db = prisma as any;
    const gitHubRecord = await db.gitHubAnalysis.findUnique({ where: { userId: user.id } });
    const latestAssessment = gitHubRecord?.analysisData?.latestAssessment || null;

    // Run deterministic gap computation
    const gapReport = computeGapReport({
      jd: jobDescription.trim(),
      assessment: latestAssessment,
      targetRole: user.targetRole || "Full Stack Engineer",
    });

    // Optional AI summary enrichment (best-effort, falls back to deterministic)
    if (gapReport.gaps.length > 0) {
      try {
        const topGaps = gapReport.gaps
          .filter((g) => g.state === "NOT_EVIDENCED" || g.state === "CLAIMED_ONLY")
          .slice(0, 5)
          .map((g) => `${g.skill} (${g.state})`)
          .join(", ");
        const topStrengths = gapReport.strengths.slice(0, 3).join(", ") || "None detected";

        const aiPrompt = `You are a technical career coach. A candidate is applying for "${gapReport.jobTitle}".
Their readiness score is ${gapReport.summary.readinessScore}/100 (${gapReport.summary.readinessLabel}).
Verified strengths: ${topStrengths}.
Key gaps: ${topGaps || "None"}.
Write ONE specific, encouraging 2-sentence coaching tip. Focus on the highest-impact action. Return plain text only.`;

        const aiTip = await generateContent(aiPrompt);
        if (aiTip && aiTip.trim().length > 20) {
          (gapReport as any).aiCoachingTip = aiTip.trim();
        }
      } catch {
        // Silently skip AI tip — deterministic report is complete
      }
    }

    // Persist to DB
    const updatedAnalysisData = {
      ...(gitHubRecord?.analysisData || {}),
      latestGapReport: gapReport,
    };

    if (gitHubRecord) {
      await db.gitHubAnalysis.update({
        where: { userId: user.id },
        data: { analysisData: updatedAnalysisData, updatedAt: new Date() },
      });
    } else {
      // No GitHub record yet — create a minimal one to store the report
      await db.gitHubAnalysis.create({
        data: {
          userId: user.id,
          githubUsername: "",
          analysisData: updatedAnalysisData,
          overallScore: gapReport.summary.readinessScore,
        },
      });
    }

    return NextResponse.json(gapReport);
  } catch (error: any) {
    console.error("POST /api/gap-report error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate gap report" },
      { status: 500 }
    );
  }
}
