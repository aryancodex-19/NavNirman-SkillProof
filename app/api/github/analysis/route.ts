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
  default_branch?: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
  payload?: any;
}

export interface DiscoveredEvidence {
  tests: { name: string; path: string; url: string; framework?: string }[];
  ciWorkflows: { name: string; path: string; url: string }[];
  deploymentConfigs: { name: string; path: string; url: string; type: string }[];
  packageManifests: { name: string; path: string; url: string; ecosystem: string }[];
  recentCommits: { sha: string; shortSha: string; message: string; date: string; url: string; authorVerified: boolean }[];
  languages: { name: string; bytes: number; percentage: number }[];
  readmeUrl: string | null;
  licenseUrl: string | null;
  defaultBranch: string;
}

export interface EnrichedRepo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  size: number;
  sizeCategory: "small" | "medium" | "large";
  topics: string[];
  updatedAt: string;
  pushedAt: string;
  isFork: boolean;
  evidence: DiscoveredEvidence;
}

function buildHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CareerOS-SkillProof-App",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchGitHub(url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch failed for ${url}:`, err);
    return null;
  }
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
  return allRepos;
}

// ─── Deep Tree & Evidence Inspector ───────────────────────

function detectTestFramework(path: string): string | undefined {
  const lower = path.toLowerCase();
  if (lower.includes("jest") || lower.endsWith(".test.ts") || lower.endsWith(".test.js") || lower.endsWith(".test.tsx") || lower.endsWith(".test.jsx")) return "Jest / Vitest";
  if (lower.includes("pytest") || lower.startsWith("test_") || lower.endsWith("_test.py")) return "Pytest";
  if (lower.endsWith("_test.go")) return "Go Test";
  if (lower.includes("cypress")) return "Cypress";
  if (lower.includes("playwright")) return "Playwright";
  if (lower.includes("mocha") || lower.includes("chai")) return "Mocha";
  if (lower.endsWith("test.java") || lower.endsWith("tests.java")) return "JUnit";
  if (lower.endsWith("_spec.rb") || lower.includes("spec/")) return "RSpec";
  if (lower.includes("/tests/") || lower.includes("/__tests__/") || lower.includes("/test/")) return "Test Suite";
  return undefined;
}

function detectDeploymentType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes("dockerfile")) return "Docker Container";
  if (lower.includes("docker-compose")) return "Docker Compose";
  if (lower.includes("vercel.json")) return "Vercel Deployment";
  if (lower.includes("netlify.toml")) return "Netlify";
  if (lower.includes("fly.toml")) return "Fly.io";
  if (lower.includes("procfile")) return "Heroku / Dokku";
  if (lower.endsWith(".k8s.yaml") || lower.endsWith(".k8s.yml") || lower.includes("kubernetes/") || lower.includes("helm/")) return "Kubernetes / Helm";
  if (lower.includes("terraform") || lower.endsWith(".tf")) return "Terraform IaC";
  return "Deployment Config";
}

function detectPackageEcosystem(path: string): string {
  const filename = path.split("/").pop() || path;
  if (filename === "package.json") return "Node.js / npm";
  if (filename === "requirements.txt" || filename === "pyproject.toml" || filename === "Pipfile") return "Python";
  if (filename === "Cargo.toml") return "Rust / Cargo";
  if (filename === "go.mod") return "Go Modules";
  if (filename === "pom.xml" || filename === "build.gradle" || filename === "build.gradle.kts") return "Java / Kotlin";
  if (filename === "Gemfile") return "Ruby / Bundler";
  if (filename === "composer.json") return "PHP / Composer";
  return "Package Manifest";
}

async function inspectRepositoryEvidence(
  repo: GitHubRepo,
  username: string,
  headers: Record<string, string>
): Promise<DiscoveredEvidence> {
  const defaultBranch = repo.default_branch || "main";
  const repoBaseUrl = repo.html_url;

  // 1. Fetch language breakdown
  const langDataPromise = fetchGitHub(
    `https://api.github.com/repos/${repo.full_name}/languages`,
    headers
  );

  // 2. Fetch Git Tree (recursive, up to 1 level deep or truncated)
  const treeDataPromise = fetchGitHub(
    `https://api.github.com/repos/${repo.full_name}/git/trees/${defaultBranch}?recursive=1`,
    headers
  );

  // 3. Fetch recent commits by user
  const commitsDataPromise = fetchGitHub(
    `https://api.github.com/repos/${repo.full_name}/commits?per_page=5&author=${username}`,
    headers
  );

  const [langData, treeData, commitsData] = await Promise.all([
    langDataPromise,
    treeDataPromise,
    commitsDataPromise,
  ]);

  // Parse languages
  const languages: { name: string; bytes: number; percentage: number }[] = [];
  if (langData && typeof langData === "object") {
    const totalBytes = Object.values(langData as Record<string, number>).reduce((a, b) => a + b, 0);
    Object.entries(langData as Record<string, number>).forEach(([name, bytes]) => {
      languages.push({
        name,
        bytes,
        percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
      });
    });
    languages.sort((a, b) => b.bytes - a.bytes);
  }

  // Parse Git Tree entries
  const tests: DiscoveredEvidence["tests"] = [];
  const ciWorkflows: DiscoveredEvidence["ciWorkflows"] = [];
  const deploymentConfigs: DiscoveredEvidence["deploymentConfigs"] = [];
  const packageManifests: DiscoveredEvidence["packageManifests"] = [];

  const treeEntries: { path: string; type: string }[] = Array.isArray(treeData?.tree)
    ? treeData.tree
    : [];

  // Limit traversal to prevent performance bottlenecks on massive monorepos
  const entriesToScan = treeEntries.slice(0, 1500);

  for (const entry of entriesToScan) {
    const path = entry.path;
    const lower = path.toLowerCase();
    const isBlob = entry.type === "blob";
    const filename = path.split("/").pop() || path;
    const fileUrl = `${repoBaseUrl}/blob/${defaultBranch}/${path}`;

    // CI Workflows
    if (path.startsWith(".github/workflows/") && (path.endsWith(".yml") || path.endsWith(".yaml"))) {
      ciWorkflows.push({
        name: filename,
        path,
        url: fileUrl,
      });
    }

    // Deployment configs
    const isDeployFile =
      filename === "Dockerfile" ||
      filename === "docker-compose.yml" ||
      filename === "docker-compose.yaml" ||
      filename === "vercel.json" ||
      filename === "netlify.toml" ||
      filename === "fly.toml" ||
      filename === "Procfile" ||
      lower.endsWith(".k8s.yaml") ||
      lower.endsWith(".k8s.yml") ||
      (lower.endsWith(".tf") && !lower.includes(".terraform/"));

    if (isBlob && isDeployFile) {
      deploymentConfigs.push({
        name: filename,
        path,
        url: fileUrl,
        type: detectDeploymentType(path),
      });
    }

    // Package Manifests
    const isManifest =
      filename === "package.json" ||
      filename === "Cargo.toml" ||
      filename === "go.mod" ||
      filename === "requirements.txt" ||
      filename === "pyproject.toml" ||
      filename === "pom.xml" ||
      filename === "build.gradle" ||
      filename === "Gemfile";

    if (isBlob && isManifest && !path.includes("node_modules/") && !path.includes("vendor/")) {
      packageManifests.push({
        name: filename,
        path,
        url: fileUrl,
        ecosystem: detectPackageEcosystem(path),
      });
    }

    // Test files
    const isTestFile =
      lower.endsWith(".test.ts") ||
      lower.endsWith(".test.tsx") ||
      lower.endsWith(".test.js") ||
      lower.endsWith(".test.jsx") ||
      lower.endsWith(".spec.ts") ||
      lower.endsWith(".spec.js") ||
      lower.endsWith("_test.go") ||
      lower.endsWith("_test.py") ||
      lower.startsWith("test_") ||
      lower.includes("/__tests__/") ||
      lower.includes("/tests/") ||
      lower.includes("/cypress/") ||
      filename === "jest.config.js" ||
      filename === "jest.config.ts" ||
      filename === "vitest.config.ts" ||
      filename === "pytest.ini";

    if (isBlob && isTestFile && !path.includes("node_modules/")) {
      if (tests.length < 15) {
        tests.push({
          name: filename,
          path,
          url: fileUrl,
          framework: detectTestFramework(path),
        });
      }
    }
  }

  // Parse commits
  const recentCommits: DiscoveredEvidence["recentCommits"] = [];
  if (Array.isArray(commitsData)) {
    for (const c of commitsData.slice(0, 5)) {
      const sha = c.sha || "";
      const shortSha = sha.substring(0, 7);
      const message = c.commit?.message?.split("\n")[0] || "Update";
      const date = c.commit?.author?.date || c.commit?.committer?.date || "";
      const commitUrl = c.html_url || `${repoBaseUrl}/commit/${sha}`;
      const authorLogin = c.author?.login?.toLowerCase();
      const authorVerified = authorLogin === username.toLowerCase();

      recentCommits.push({
        sha,
        shortSha,
        message,
        date,
        url: commitUrl,
        authorVerified,
      });
    }
  }

  return {
    tests,
    ciWorkflows,
    deploymentConfigs,
    packageManifests,
    recentCommits,
    languages,
    readmeUrl: `${repoBaseUrl}#readme`,
    licenseUrl: repo.license ? `${repoBaseUrl}/blob/${defaultBranch}/LICENSE` : null,
    defaultBranch,
  };
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

function analyzeLanguages(repos: GitHubRepo[], enrichedRepos: EnrichedRepo[]) {
  const langMap: Record<string, number> = {};
  let totalBytes = 0;

  // Prefer deeply extracted language bytes from inspected repositories
  enrichedRepos.forEach((er) => {
    if (er.evidence?.languages && er.evidence.languages.length > 0) {
      er.evidence.languages.forEach((l) => {
        langMap[l.name] = (langMap[l.name] || 0) + l.bytes;
        totalBytes += l.bytes;
      });
    }
  });

  // Fallback for repos not deeply inspected
  if (totalBytes === 0) {
    repos.forEach((r) => {
      if (r.language) {
        langMap[r.language] = (langMap[r.language] || 0) + r.size * 1024;
        totalBytes += r.size * 1024;
      }
    });
  }

  const languages = Object.entries(langMap)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  // Tech stack identification
  const techCategories: Record<string, string[]> = {
    Frontend: ["JavaScript", "TypeScript", "HTML", "CSS", "SCSS", "Vue", "Svelte"],
    Backend: ["Python", "Java", "Go", "Ruby", "PHP", "C#", "Rust", "Kotlin"],
    Mobile: ["Swift", "Kotlin", "Dart", "Objective-C"],
    Systems: ["C", "C++", "Rust", "Assembly"],
    "Data Science": ["Jupyter Notebook", "R", "MATLAB", "Python"],
    DevOps: ["Shell", "Dockerfile", "HCL", "Nix"],
  };

  const techStack: { category: string; languages: string[] }[] = [];
  const langNames = languages.map((l) => l.name);

  Object.entries(techCategories).forEach(([category, langs]) => {
    const matched = langs.filter((l) => langNames.includes(l));
    if (matched.length > 0) {
      techStack.push({ category, languages: Array.from(new Set(matched)) });
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

function analyzeProjects(repos: GitHubRepo[], profile: any, enrichedRepos: EnrichedRepo[]) {
  const nonForkRepos = repos.filter((r) => !r.fork);
  const totalStars = nonForkRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = nonForkRepos.reduce((sum, r) => sum + r.forks_count, 0);
  const totalWatchers = nonForkRepos.reduce((sum, r) => sum + r.watchers_count, 0);

  // Top repos by stars / recent activity
  const topRepos = enrichedRepos.map((r) => ({
    name: r.name,
    fullName: r.fullName,
    description: r.description,
    url: r.url,
    stars: r.stars,
    forks: r.forks,
    language: r.primaryLanguage,
    size: r.size,
    sizeCategory: r.sizeCategory,
    topics: r.topics || [],
    updatedAt: r.updatedAt,
    evidence: r.evidence,
  }));

  // Project size distribution
  const sizeDistribution = {
    small: nonForkRepos.filter((r) => r.size < 500).length,
    medium: nonForkRepos.filter((r) => r.size >= 500 && r.size < 5000).length,
    large: nonForkRepos.filter((r) => r.size >= 5000).length,
  };

  // Topics analysis
  const topicsSet = new Set<string>();
  nonForkRepos.forEach((r) => (r.topics || []).forEach((t) => topicsSet.add(t)));

  // Quality heuristics with evidence checks
  const reposWithDescription = nonForkRepos.filter((r) => r.description && r.description.length > 10).length;
  const reposWithTopics = nonForkRepos.filter((r) => r.topics && r.topics.length > 0).length;
  const reposWithLicense = nonForkRepos.filter((r) => r.license).length;
  const reposWithTests = enrichedRepos.filter((r) => r.evidence?.tests?.length > 0).length;
  const reposWithCI = enrichedRepos.filter((r) => r.evidence?.ciWorkflows?.length > 0).length;

  const qualityRatio = nonForkRepos.length > 0
    ? (reposWithDescription + reposWithTopics + reposWithLicense + reposWithTests * 2 + reposWithCI * 2) / (nonForkRepos.length * 7)
    : 0;

  // Project score
  let score = 0;
  score += Math.min(20, nonForkRepos.length * 2); // Repo count (max 20)
  score += Math.min(20, totalStars * 2); // Stars (max 20)
  score += Math.min(15, totalForks * 3); // Forks (max 15)
  score += Math.min(20, sizeDistribution.large * 10 + sizeDistribution.medium * 5); // Project size (max 20)
  score += Math.min(25, Math.round(qualityRatio * 25)); // Verified quality with tests/CI (max 25)
  score = Math.min(100, score);

  return {
    score,
    totalRepos: nonForkRepos.length,
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
  const nonForkRepos = repos.filter((r) => !r.fork);
  const reposToCheck = nonForkRepos.slice(0, 10);
  const results: {
    name: string;
    hasReadme: boolean;
    hasLicense: boolean;
    hasDescription: boolean;
    readmeLength: number;
    hasSetupInstructions: boolean;
    readmeUrl?: string;
    licenseUrl?: string | null;
    docScore: number;
  }[] = [];

  for (const repo of reposToCheck) {
    let hasReadme = false;
    let readmeLength = 0;
    let hasSetupInstructions = false;
    const defaultBranch = repo.default_branch || "main";

    // Check README
    const readmeData = await fetchGitHub(
      `https://api.github.com/repos/${repo.full_name}/readme`,
      headers
    );

    if (readmeData) {
      hasReadme = true;
      if (readmeData.size) {
        readmeLength = readmeData.size;
      }
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
            lowerContent.includes("pip install") ||
            lowerContent.includes("cargo run");
        } catch { /* ignore decode errors */ }
      }
    }

    const hasLicense = !!repo.license;
    const hasDescription = !!repo.description && repo.description.length > 10;

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
      readmeUrl: `${repo.html_url}#readme`,
      licenseUrl: hasLicense ? `${repo.html_url}/blob/${defaultBranch}/LICENSE` : null,
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
      message: "Increase commit cadence. Aim for consistent weekly commits to show active development momentum.",
    });
  }

  // Testing & Quality recommendations
  const reposWithTests = analysis.projects?.topRepos?.filter((r: any) => r.evidence?.tests?.length > 0).length || 0;
  if (reposWithTests === 0) {
    recommendations.push({
      category: "Testing",
      priority: "high",
      message: "Add automated test suites (e.g. Jest, Pytest, Go test) to your key repositories to prove verifiable code correctness.",
    });
  }

  // CI/CD recommendations
  const reposWithCI = analysis.projects?.topRepos?.filter((r: any) => r.evidence?.ciWorkflows?.length > 0).length || 0;
  if (reposWithCI === 0) {
    recommendations.push({
      category: "DevOps & CI/CD",
      priority: "medium",
      message: "Configure GitHub Actions workflows (.github/workflows) to demonstrate automated builds and CI best practices.",
    });
  }

  // Language recommendations
  if (languageScore < 40) {
    recommendations.push({
      category: "Languages",
      priority: "medium",
      message: "Diversify tech stack depth. Explore full-stack frameworks and systems languages to expand technical versatility.",
    });
  }

  // Documentation recommendations
  if (docScore < 50) {
    recommendations.push({
      category: "Documentation",
      priority: "high",
      message: "Enhance README files with clear architecture diagrams, installation steps, and code examples.",
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

export async function POST() {
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
      return Response.json({ error: "Failed to fetch GitHub profile. Rate limit may be exceeded." }, { status: 502 });
    }

    // 2. Fetch all public repos
    const allRepos = await fetchAllRepos(githubUsername, headers);
    const nonForkRepos = allRepos.filter((r) => !r.fork);

    // Sort by stars and recent updates to pick top candidates for deep inspection
    const reposForDeepScan = [...nonForkRepos]
      .sort((a, b) => (b.stargazers_count * 10 + new Date(b.pushed_at).getTime()) - (a.stargazers_count * 10 + new Date(a.pushed_at).getTime()))
      .slice(0, 8);

    // 3. Concurrently inspect trees, languages, and commits for top repos
    const scanResults = await Promise.allSettled(
      reposForDeepScan.map(async (repo) => {
        const evidence = await inspectRepositoryEvidence(repo, githubUsername, headers);
        const enriched: EnrichedRepo = {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          primaryLanguage: repo.language,
          size: repo.size,
          sizeCategory: repo.size < 500 ? "small" : repo.size < 5000 ? "medium" : "large",
          topics: repo.topics || [],
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          isFork: repo.fork,
          evidence,
        };
        return enriched;
      })
    );

    const enrichedRepos: EnrichedRepo[] = scanResults
      .filter((r): r is PromiseFulfilledResult<EnrichedRepo> => r.status === "fulfilled")
      .map((r) => r.value);

    // 4. Fetch events
    const events: GitHubEvent[] =
      (await fetchGitHub(
        `https://api.github.com/users/${githubUsername}/events/public?per_page=100`,
        headers
      )) || [];

    // 5. Run analyses
    const activity = analyzeActivity(events, nonForkRepos);
    const languages = analyzeLanguages(nonForkRepos, enrichedRepos);
    const projects = analyzeProjects(nonForkRepos, profile, enrichedRepos);
    const documentation = await analyzeDocumentation(nonForkRepos, headers);

    // 6. Compute overall score
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

    // 7. Generate recommendations
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
      evidenceSummary: {
        totalInspectedRepos: enrichedRepos.length,
        totalTestSuites: enrichedRepos.reduce((acc, r) => acc + (r.evidence?.tests?.length || 0), 0),
        totalCIWorkflows: enrichedRepos.reduce((acc, r) => acc + (r.evidence?.ciWorkflows?.length || 0), 0),
        totalDeploymentConfigs: enrichedRepos.reduce((acc, r) => acc + (r.evidence?.deploymentConfigs?.length || 0), 0),
        totalVerifiedCommits: enrichedRepos.reduce((acc, r) => acc + (r.evidence?.recentCommits?.length || 0), 0),
      },
    };

    // 8. Save to DB
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
