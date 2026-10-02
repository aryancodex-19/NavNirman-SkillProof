import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

// ─── Helpers ───────────────────────────────────────────────

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
  has_wiki: boolean;
  license: { spdx_id: string } | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
}

function buildHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CareerOS-App",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchGitHub(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return res.json();
}

// Fetch all pages of repos (up to 300)
async function fetchAllRepos(username: string, headers: Record<string, string>): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const repos = await fetchGitHub(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated&page=${page}`,
      headers
    );
    if (!repos || !Array.isArray(repos) || repos.length === 0) break;
    allRepos.push(...repos);
    if (repos.length < 100) break;
  }
  return allRepos.filter((r) => !r.fork);
}

// ─── Scoring Functions ─────────────────────────────────────

function analyzeActivity(events: GitHubEvent[], repos: GitHubRepo[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Commit-related events
  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const recentPushEvents = pushEvents.filter(
    (e) => new Date(e.created_at) >= thirtyDaysAgo
  );

  // Activity by day of week (from events)
  const dayMap: Record<string, number> = {};
  const weekMap: Record<string, number> = {};
  const monthMap: Record<string, number> = {};

  events.forEach((e) => {
    const d = new Date(e.created_at);
    const dayKey = d.toISOString().split("T")[0];
    const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    dayMap[dayKey] = (dayMap[dayKey] || 0) + 1;
    weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
    monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
  });

  const activeDays = Object.keys(dayMap).length;
  const totalEvents = events.length;

  // Repo activity — recently pushed repos
  const recentlyActiveRepos = repos.filter(
    (r) => r.pushed_at && new Date(r.pushed_at) >= ninetyDaysAgo
  ).length;

  const activeReposLastYear = repos.filter(
    (r) => r.pushed_at && new Date(r.pushed_at) >= oneYearAgo
  ).length;

  // Build a heatmap data structure (last 52 weeks × 7 days)
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    heatmapData.push({ date: key, count: dayMap[key] || 0 });
  }

  // Consistency score: how many of the last 90 days had activity
  const last90Days: string[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    last90Days.push(d.toISOString().split("T")[0]);
  }
  const activeLast90 = last90Days.filter((d) => dayMap[d] > 0).length;
  const consistencyScore = Math.min(100, Math.round((activeLast90 / 90) * 100 * 1.5));

  // Trend: compare last 30 days vs previous 30 days
  const last30 = recentPushEvents.length;
  const prev30 = pushEvents.filter((e) => {
    const d = new Date(e.created_at);
    const sixtyAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    return d >= sixtyAgo && d < thirtyDaysAgo;
  }).length;

  let trend: "up" | "down" | "steady" = "steady";
  if (last30 > prev30 * 1.2) trend = "up";
  else if (last30 < prev30 * 0.8) trend = "down";

  // Activity score (0-100)
  let score = 0;
  score += Math.min(30, activeDays * 2); // Active days (max 30)
  score += Math.min(25, recentPushEvents.length * 3); // Recent pushes (max 25)
  score += Math.min(20, recentlyActiveRepos * 5); // Recent repos (max 20)
  score += Math.min(25, consistencyScore / 4); // Consistency (max 25)
  score = Math.min(100, score);

  return {
    score,
    totalEvents,
    activeDays,
    recentPushEvents: recentPushEvents.length,
    recentlyActiveRepos,
    activeReposLastYear,
    consistencyScore,
    trend,
    heatmapData,
    dailyAverage: activeDays > 0 ? Math.round((totalEvents / activeDays) * 10) / 10 : 0,
    weeklyAverage: Object.keys(weekMap).length > 0
      ? Math.round((totalEvents / Object.keys(weekMap).length) * 10) / 10
      : 0,
    monthlyAverage: Object.keys(monthMap).length > 0
      ? Math.round((totalEvents / Object.keys(monthMap).length) * 10) / 10
      : 0,
  };
}

function analyzeLanguages(repos: GitHubRepo[]) {
  const langMap: Record<string, number> = {};
  let totalSize = 0;

  repos.forEach((r) => {
    if (r.language) {
      langMap[r.language] = (langMap[r.language] || 0) + r.size;
      totalSize += r.size;
    }
  });

  const languages = Object.entries(langMap)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalSize > 0 ? Math.round((bytes / totalSize) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  // Tech stack identification
  const techCategories: Record<string, string[]> = {
    Frontend: ["JavaScript", "TypeScript", "HTML", "CSS", "SCSS", "Vue", "Svelte"],
    Backend: ["Python", "Java", "Go", "Ruby", "PHP", "C#", "Rust", "Kotlin"],
    "Mobile": ["Swift", "Kotlin", "Dart", "Objective-C"],
    "Systems": ["C", "C++", "Rust", "Assembly"],
    "Data Science": ["Jupyter Notebook", "R", "MATLAB"],
    DevOps: ["Shell", "Dockerfile", "HCL", "Nix"],
  };

  const techStack: { category: string; languages: string[] }[] = [];
  const langNames = languages.map((l) => l.name);

  Object.entries(techCategories).forEach(([category, langs]) => {
    const matched = langs.filter((l) => langNames.includes(l));
    if (matched.length > 0) {
      techStack.push({ category, languages: matched });
    }
  });

  // Language score: diversity + depth
  const uniqueLanguages = languages.length;
  let score = 0;
  score += Math.min(40, uniqueLanguages * 8); // Diversity (max 40)
  score += Math.min(30, techStack.length * 10); // Tech breadth (max 30)
  score += Math.min(30, languages[0]?.percentage >= 20 ? 30 : languages[0]?.percentage * 1.5 || 0); // Primary depth (max 30)
  score = Math.min(100, score);

  return {
    score,
    languages: languages.slice(0, 10),
    techStack,
    totalLanguages: uniqueLanguages,
    primaryLanguage: languages[0]?.name || "None",
  };
}

function analyzeProjects(repos: GitHubRepo[], profile: any) {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const totalWatchers = repos.reduce((sum, r) => sum + r.watchers_count, 0);

  // Top repos by stars
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8)
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      size: r.size,
      sizeCategory: r.size < 500 ? "small" : r.size < 5000 ? "medium" : "large",
      topics: r.topics || [],
      updatedAt: r.updated_at,
    }));

  // Project size distribution
  const sizeDistribution = {
    small: repos.filter((r) => r.size < 500).length,
    medium: repos.filter((r) => r.size >= 500 && r.size < 5000).length,
    large: repos.filter((r) => r.size >= 5000).length,
  };

  // Topics analysis
  const topicsSet = new Set<string>();
  repos.forEach((r) => (r.topics || []).forEach((t) => topicsSet.add(t)));

  // Code quality heuristics
  const reposWithDescription = repos.filter((r) => r.description && r.description.length > 10).length;
  const reposWithTopics = repos.filter((r) => r.topics && r.topics.length > 0).length;
  const reposWithLicense = repos.filter((r) => r.license).length;

  const qualityRatio = repos.length > 0
    ? (reposWithDescription + reposWithTopics + reposWithLicense) / (repos.length * 3)
    : 0;

  // Project score
  let score = 0;
  score += Math.min(20, repos.length * 2); // Repo count (max 20)
  score += Math.min(25, totalStars * 2); // Stars (max 25)
  score += Math.min(15, totalForks * 3); // Forks (max 15)
  score += Math.min(20, sizeDistribution.large * 10 + sizeDistribution.medium * 5); // Project size (max 20)
  score += Math.min(20, Math.round(qualityRatio * 20)); // Quality (max 20)
  score = Math.min(100, score);

  return {
    score,
    totalRepos: repos.length,
    totalStars,
    totalForks,
    totalWatchers,
    topRepos,
    sizeDistribution,
    qualityScore: Math.round(qualityRatio * 100),
    topics: Array.from(topicsSet).slice(0, 20),
    followers: profile?.followers || 0,
    following: profile?.following || 0,
  };
}

async function analyzeDocumentation(repos: GitHubRepo[], headers: Record<string, string>) {
  // Check README, LICENSE, etc. for top repos (limit to 15 to avoid rate limits)
  const reposToCheck = repos.slice(0, 15);
  const results: {
    name: string;
    hasReadme: boolean;
    hasLicense: boolean;
    hasDescription: boolean;
    readmeLength: number;
    hasSetupInstructions: boolean;
    docScore: number;
  }[] = [];

  for (const repo of reposToCheck) {
    let hasReadme = false;
    let readmeLength = 0;
    let hasSetupInstructions = false;

    // Check README
    const readmeData = await fetchGitHub(
      `https://api.github.com/repos/${repo.full_name}/readme`,
      headers
    );

    if (readmeData) {
      hasReadme = true;
      // Content is base64 encoded
      if (readmeData.size) {
        readmeLength = readmeData.size;
      }
      // Decode and check for setup instructions
      if (readmeData.content) {
        try {
          const content = atob(readmeData.content.replace(/\n/g, ""));
          const lowerContent = content.toLowerCase();
          hasSetupInstructions =
            lowerContent.includes("install") ||
            lowerContent.includes("setup") ||
            lowerContent.includes("getting started") ||
            lowerContent.includes("usage") ||
            lowerContent.includes("how to run") ||
            lowerContent.includes("npm") ||
            lowerContent.includes("pip install");
        } catch { /* ignore decode errors */ }
      }
    }

    const hasLicense = !!repo.license;
    const hasDescription = !!repo.description && repo.description.length > 10;

    // Per-repo doc score
    let docScore = 0;
    if (hasReadme) docScore += 30;
    if (readmeLength > 500) docScore += 15;
    if (readmeLength > 2000) docScore += 10;
    if (hasLicense) docScore += 15;
    if (hasDescription) docScore += 15;
    if (hasSetupInstructions) docScore += 15;
    docScore = Math.min(100, docScore);

    results.push({
      name: repo.name,
      hasReadme,
      hasLicense,
      hasDescription,
      readmeLength,
      hasSetupInstructions,
      docScore,
    });
  }

  const totalChecked = results.length;
  const readmeCount = results.filter((r) => r.hasReadme).length;
  const licenseCount = results.filter((r) => r.hasLicense).length;
  const descriptionCount = results.filter((r) => r.hasDescription).length;
  const setupCount = results.filter((r) => r.hasSetupInstructions).length;

  const readmePercentage = totalChecked > 0 ? Math.round((readmeCount / totalChecked) * 100) : 0;
  const licensePercentage = totalChecked > 0 ? Math.round((licenseCount / totalChecked) * 100) : 0;
  const descriptionPercentage = totalChecked > 0 ? Math.round((descriptionCount / totalChecked) * 100) : 0;
  const setupPercentage = totalChecked > 0 ? Math.round((setupCount / totalChecked) * 100) : 0;

  // Overall documentation score
  const avgDocScore = totalChecked > 0
    ? Math.round(results.reduce((sum, r) => sum + r.docScore, 0) / totalChecked)
    : 0;

  return {
    score: avgDocScore,
    totalChecked,
    readmePercentage,
    licensePercentage,
    descriptionPercentage,
    setupPercentage,
    repoDetails: results,
  };
}

function generateRecommendations(
  activityScore: number,
  languageScore: number,
  projectScore: number,
  docScore: number,
  analysis: any
) {
  const recommendations: { category: string; priority: "high" | "medium" | "low"; message: string }[] = [];

  // Activity recommendations
  if (activityScore < 40) {
    recommendations.push({
      category: "Activity",
      priority: "high",
      message: "Increase your commit frequency. Aim for at least 3-4 commits per week to show consistent coding activity.",
    });
  }
  if (analysis.activity?.consistencyScore < 30) {
    recommendations.push({
      category: "Activity",
      priority: "high",
      message: "Work on coding consistency. Try to contribute code at least a few days each week rather than in sporadic bursts.",
    });
  }
  if (analysis.activity?.trend === "down") {
    recommendations.push({
      category: "Activity",
      priority: "medium",
      message: "Your activity has been declining recently. Consider setting daily coding goals to maintain momentum.",
    });
  }

  // Language recommendations
  if (languageScore < 40) {
    recommendations.push({
      category: "Languages",
      priority: "medium",
      message: "Diversify your tech stack. Explore new programming languages or frameworks to demonstrate versatility.",
    });
  }
  if (analysis.languages?.totalLanguages < 3) {
    recommendations.push({
      category: "Languages",
      priority: "medium",
      message: "Branch out from your primary language. Build projects in at least 2-3 different languages.",
    });
  }

  // Project recommendations
  if (projectScore < 40) {
    recommendations.push({
      category: "Projects",
      priority: "high",
      message: "Build more substantial projects. Aim for medium-to-large repos that showcase your problem-solving abilities.",
    });
  }
  if (analysis.projects?.totalStars < 5) {
    recommendations.push({
      category: "Projects",
      priority: "low",
      message: "Share your projects on social media and developer communities to gain stars and visibility.",
    });
  }
  if (analysis.projects?.qualityScore < 50) {
    recommendations.push({
      category: "Projects",
      priority: "medium",
      message: "Add descriptions and topics to your repositories. Well-documented repos attract more attention.",
    });
  }

  // Documentation recommendations
  if (docScore < 40) {
    recommendations.push({
      category: "Documentation",
      priority: "high",
      message: "Add comprehensive README files to all your repositories. Include project description, setup instructions, and usage examples.",
    });
  }
  if (analysis.documentation?.licensePercentage < 50) {
    recommendations.push({
      category: "Documentation",
      priority: "low",
      message: "Add open-source licenses (like MIT or Apache 2.0) to your projects to encourage collaboration.",
    });
  }
  if (analysis.documentation?.setupPercentage < 50) {
    recommendations.push({
      category: "Documentation",
      priority: "medium",
      message: "Include setup/installation instructions in your READMEs. This shows professionalism and helps other developers.",
    });
  }

  return recommendations.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Expert", color: "#10b981" };
  if (score >= 60) return { label: "Advanced", color: "#6366f1" };
  if (score >= 40) return { label: "Intermediate", color: "#f59e0b" };
  return { label: "Beginner", color: "#ef4444" };
}

// ─── Route Handler ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const db = prisma as any;
    const existingAnalysis = await db.gitHubAnalysis.findUnique({
      where: { userId: user.id },
    });

    if (!existingAnalysis) {
      return Response.json(
        { error: "Please connect your GitHub account first" },
        { status: 400 }
      );
    }

    const { githubUsername, githubToken } = existingAnalysis;
    const headers = buildHeaders(githubToken);

    // 1. Fetch profile
    const profile = await fetchGitHub(
      `https://api.github.com/users/${githubUsername}`,
      headers
    );

    if (!profile) {
      return Response.json({ error: "Failed to fetch GitHub profile" }, { status: 502 });
    }

    // 2. Fetch repos
    const repos = await fetchAllRepos(githubUsername, headers);

    // 3. Fetch events
    const events: GitHubEvent[] =
      (await fetchGitHub(
        `https://api.github.com/users/${githubUsername}/events/public?per_page=100`,
        headers
      )) || [];

    // 4. Run analyses
    const activity = analyzeActivity(events, repos);
    const languages = analyzeLanguages(repos);
    const projects = analyzeProjects(repos, profile);
    const documentation = await analyzeDocumentation(repos, headers);

    // 5. Compute overall score
    const overallScore = Math.round(
      activity.score * 0.3 +
      languages.score * 0.2 +
      projects.score * 0.3 +
      documentation.score * 0.2
    );

    const analysisPayload = {
      activity,
      languages,
      projects,
      documentation,
    };

    // 6. Generate recommendations
    const recommendations = generateRecommendations(
      activity.score,
      languages.score,
      projects.score,
      documentation.score,
      analysisPayload
    );

    const level = getScoreLevel(overallScore);

    const fullResult = {
      ...analysisPayload,
      overallScore,
      recommendations,
      level,
      profile: {
        username: githubUsername,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        profileUrl: profile.html_url,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        createdAt: profile.created_at,
      },
    };

    // 7. Save to DB
    await db.gitHubAnalysis.update({
      where: { userId: user.id },
      data: {
        analysisData: fullResult as any,
        overallScore,
        analyzedAt: new Date(),
      },
    });

    return Response.json(fullResult);
  } catch (error: any) {
    console.error("GitHub analysis error:", error);
    return Response.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return Response.json(null);
    }

    const db = prisma as any;
    const analysis = await db.gitHubAnalysis.findUnique({
      where: { userId: user.id },
    });

    if (
      !analysis ||
      !analysis.analysisData ||
      (typeof analysis.analysisData === "object" && Object.keys(analysis.analysisData).length === 0)
    ) {
      return Response.json(null);
    }

    return Response.json(analysis.analysisData);
  } catch (error: any) {
    console.error("Get analysis error:", error);
    return Response.json(
      { error: error.message || "Failed to get analysis" },
      { status: 500 }
    );
  }
}
