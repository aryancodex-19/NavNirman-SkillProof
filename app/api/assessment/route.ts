import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { runSkillEvidenceAssessment } from "@/lib/assessment/engine";

export const maxDuration = 60;

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        resumes: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(null);
    }

    const db = prisma as any;
    const gitHubRecord = await db.gitHubAnalysis.findUnique({
      where: { userId: user.id },
    });

    const latestAssessment = gitHubRecord?.analysisData?.latestAssessment || null;

    return NextResponse.json({
      assessment: latestAssessment,
      user: {
        targetRole: user.targetRole,
        githubUsername: gitHubRecord?.githubUsername || null,
        hasGitHubData: !!(gitHubRecord?.analysisData?.projects),
        hasResume: user.resumes.length > 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch assessment" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      resumeId,
      resumeSkills: inputSkills,
      githubUsername: inputUsername,
      targetRole,
    } = body as {
      resumeId?: string;
      resumeSkills?: string[];
      githubUsername?: string;
      targetRole?: string;
    };

    if (!targetRole || typeof targetRole !== "string" || targetRole.trim().length === 0) {
      return NextResponse.json(
        { error: "Please select or specify a target job role." },
        { status: 400 }
      );
    }

    // 1. Resolve Resume Skills
    let finalSkills: string[] = [];

    if (inputSkills !== undefined) {
      if (Array.isArray(inputSkills)) {
        finalSkills = inputSkills.filter((s) => typeof s === "string" && s.trim().length > 0);
      }
    } else if (resumeId) {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, userId: user.id },
      });
      if (resume?.skills) {
        try {
          finalSkills = JSON.parse(resume.skills);
        } catch {
          finalSkills = [];
        }
      }
    } else {
      const latestResume = await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (latestResume?.skills) {
        try {
          finalSkills = JSON.parse(latestResume.skills);
        } catch {
          finalSkills = [];
        }
      }
    }

    console.log(`[Assessment API] Resolved skills count: ${finalSkills.length} (from ${inputSkills !== undefined ? "direct payload" : resumeId ? "resumeId" : "latestResume"})`);

    if (!Array.isArray(finalSkills) || finalSkills.length === 0) {
      return NextResponse.json(
        {
          error:
            "No technical skills found. Please upload a resume with recognizable technical skills before running the assessment.",
        },
        { status: 400 }
      );
    }

    // 2. Resolve GitHub Username and Evidence Data
    const db = prisma as any;
    let gitHubRecord = await db.gitHubAnalysis.findUnique({
      where: { userId: user.id },
    });

    let effectiveUsername = inputUsername?.trim().replace(/^@/, "") || gitHubRecord?.githubUsername || "";

    if (!effectiveUsername) {
      return NextResponse.json(
        { error: "Please provide a valid GitHub username to inspect evidence." },
        { status: 400 }
      );
    }

    if (!GITHUB_USERNAME_REGEX.test(effectiveUsername)) {
      return NextResponse.json(
        { error: "Invalid GitHub username format. Please enter a valid username." },
        { status: 400 }
      );
    }

    // If username changed or no analysis exists, perform an on-demand GitHub connection & analysis
    let githubData = gitHubRecord?.analysisData || null;

    if (!githubData || !githubData.projects || gitHubRecord?.githubUsername?.toLowerCase() !== effectiveUsername.toLowerCase()) {
      // Connect / validate username first
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CareerOS-SkillProof-Assessment",
      };
      if (gitHubRecord?.githubToken) {
        headers.Authorization = `Bearer ${gitHubRecord.githubToken}`;
      }

      const ghRes = await fetch(`https://api.github.com/users/${effectiveUsername}`, { headers });
      if (!ghRes.ok) {
        if (ghRes.status === 404) {
          return NextResponse.json(
            { error: `GitHub user "${effectiveUsername}" not found. Please verify the username.` },
            { status: 404 }
          );
        }
        if (ghRes.status === 403) {
          return NextResponse.json(
            { error: "GitHub API rate limit reached. Please try again in a few minutes or provide a GitHub Personal Access Token." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: `Failed to access GitHub user profile (${ghRes.status}).` },
          { status: 502 }
        );
      }

      // Upsert the record
      gitHubRecord = await db.gitHubAnalysis.upsert({
        where: { userId: user.id },
        update: {
          githubUsername: effectiveUsername,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          githubUsername: effectiveUsername,
          analysisData: {},
          overallScore: 0,
        },
      });

      // Trigger standard internal analysis logic or fetch repos directly
      const reposRes = await fetch(
        `https://api.github.com/users/${effectiveUsername}/repos?per_page=100&sort=updated`,
        { headers }
      );

      const rawRepos = reposRes.ok ? await reposRes.json() : [];
      const nonForkRepos = Array.isArray(rawRepos) ? rawRepos.filter((r: any) => !r.fork) : [];

      // Minimal enrichment for instant assessment
      const topRepos = nonForkRepos.slice(0, 8).map((r: any) => ({
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        topics: r.topics || [],
        evidence: {
          languages: r.language ? [{ name: r.language, bytes: r.size * 1024, percentage: 100 }] : [],
          packageManifests: [],
          tests: [],
          ciWorkflows: [],
          deploymentConfigs: [],
          recentCommits: [],
          defaultBranch: r.default_branch || "main",
        },
      }));

      githubData = {
        projects: {
          totalRepos: nonForkRepos.length,
          topRepos,
        },
        languages: {
          languages: Array.from(new Set(nonForkRepos.map((r: any) => r.language).filter(Boolean))).map((lang) => ({
            name: lang,
            bytes: 10000,
            percentage: Math.round(100 / (nonForkRepos.length || 1)),
          })),
        },
      };
    }

    // 3. Run the Evidence Assessment Engine
    const assessmentResult = await runSkillEvidenceAssessment({
      resumeSkills: finalSkills,
      githubData,
      targetRoleName: targetRole.trim(),
      githubUsername: effectiveUsername,
    });

    // 4. Persist to DB
    const updatedAnalysisData = {
      ...(gitHubRecord?.analysisData || {}),
      latestAssessment: assessmentResult,
    };

    await db.gitHubAnalysis.update({
      where: { userId: user.id },
      data: {
        analysisData: updatedAnalysisData,
        updatedAt: new Date(),
      },
    });

    // Save target role to user profile if not set
    if (!user.targetRole || user.targetRole !== targetRole.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { targetRole: targetRole.trim() },
      });
    }

    return NextResponse.json(assessmentResult);
  } catch (error: any) {
    console.error("POST /api/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute assessment" },
      { status: 500 }
    );
  }
}
