import type {
  EvidenceLink,
  EvidenceStrength,
  GitHubRepoEvidence,
  JobRequirementReport,
  SkillClaim,
  SkillGap,
  SkillVerdict,
} from "@/types/skillproof";

const SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ["javascript", "js", "es6", "ecmascript"],
  TypeScript: ["typescript", "ts", "tsx"],
  Python: ["python", "py", "python3"],
  React: ["react", "reactjs", "react.js"],
  "Node.js": ["node", "nodejs", "node.js", "express"],
  "Next.js": ["next", "nextjs", "next.js"],
  "MongoDB": ["mongodb", "mongo"],
  PostgreSQL: ["postgresql", "postgres", "psql"],
  Redis: ["redis"],
  Docker: ["docker", "dockerfile", "containerization"],
  AWS: ["aws", "amazon web services"],
  Java: ["java"],
  "C#": ["csharp", "c#"],
  "C++": ["cpp", "c++", "cplusplus"],
  Go: ["golang", "go"],
  Rust: ["rust"],
  PHP: ["php"],
  SQL: ["sql"],
  GraphQL: ["graphql"],
  Tailwind: ["tailwind", "tailwindcss"],
  Django: ["django"],
  Flask: ["flask"],
  Spring: ["spring", "spring boot"],
  Firebase: ["firebase"],
  Supabase: ["supabase"],
  Jest: ["jest"],
  Vitest: ["vitest"],
  Pytest: ["pytest"],
  Cypress: ["cypress"],
  Playwright: ["playwright"],
  Kubernetes: ["kubernetes", "k8s"],
  Terraform: ["terraform"],
  "CI/CD": ["ci/cd", "github actions", "gitlab ci"],
};

const SKILL_PRIORITY = new Set([
  "JavaScript",
  "TypeScript",
  "Python",
  "React",
  "Node.js",
  "Next.js",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Java",
  "Go",
  "Rust",
  "PHP",
  "SQL",
  "GraphQL",
  "Tailwind",
  "Django",
  "Flask",
  "Spring",
  "Firebase",
  "Supabase",
  "Jest",
  "Vitest",
  "Cypress",
  "Playwright",
  "Kubernetes",
  "Terraform",
]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSkillName(skill: string): string {
  if (!skill) return "";

  const trimmed = skill.trim();
  const lower = trimmed.toLowerCase();

  const direct = Object.entries(SKILL_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => alias.toLowerCase() === lower || alias.toLowerCase().replace(/\s+/g, "") === lower.replace(/\s+/g, ""))
  );

  if (direct) return direct[0];

  const withoutPunctuation = trimmed.replace(/[^a-z0-9+\s.-]/gi, "").trim();
  const compact = withoutPunctuation.replace(/\s+/g, "").toLowerCase();

  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const aliasSet = [canonical, ...aliases].map((alias) => alias.toLowerCase().replace(/\s+/g, ""));
    if (aliasSet.includes(compact)) {
      return canonical;
    }
  }

  return trimmed.replace(/\s+/g, " ").replace(/^[-•\s]+|[-•\s]+$/g, "");
}

export function extractSkillKeywords(text: string, fallbackSkills: string[] = []): string[] {
  const allSkills = [...fallbackSkills, text];
  const seen = new Set<string>();
  const matches: string[] = [];

  for (const source of allSkills) {
    if (!source) continue;
    const candidateText = source.toString();

    for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
      const aliasList = [canonical, ...aliases];
      const hasMatch = aliasList.some((alias) => {
        const target = alias.trim();
        if (!target) return false;
        const regex = new RegExp(`\\b${escapeRegex(target)}\\b`, "i");
        return regex.test(candidateText);
      });

      if (hasMatch && !seen.has(canonical)) {
        seen.add(canonical);
        matches.push(canonical);
      }
    }
  }

  if (matches.length === 0) {
    for (const item of fallbackSkills) {
      const normalized = normalizeSkillName(item);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        matches.push(normalized);
      }
    }
  }

  return [...matches].sort((a, b) => {
    const aRank = SKILL_PRIORITY.has(a) ? 1 : 0;
    const bRank = SKILL_PRIORITY.has(b) ? 1 : 0;
    if (aRank !== bRank) return bRank - aRank;
    return a.localeCompare(b);
  });
}

function matchSkillAlias(skill: string, candidate: string): boolean {
  const normalized = normalizeSkillName(skill);
  if (!normalized) return false;

  const candidateNormalized = normalizeSkillName(candidate);
  if (!candidateNormalized) return false;

  return normalized.toLowerCase() === candidateNormalized.toLowerCase();
}

function repoSupportsSkill(skill: string, analysis: any): { matched: boolean; reasons: string[]; languages: string[]; testsDetected: boolean; recentActivity: boolean; deploymentEvidence: boolean } {
  const normalizedSkill = normalizeSkillName(skill);
  if (!normalizedSkill) {
    return { matched: false, reasons: [], languages: [], testsDetected: false, recentActivity: false, deploymentEvidence: false };
  }

  const reasons: string[] = [];
  const languages: string[] = [];
  const repoLanguages = Array.isArray(analysis.languages) ? analysis.languages : [];

  const repoSkills = repoLanguages.map((entry: any) => {
    if (typeof entry === "string") return entry;
    return entry?.name || entry?.language || "";
  });

  const hasLanguageEvidence = repoSkills.some((language: string) => {
    const normalizedLanguage = normalizeSkillName(language);
    return normalizedLanguage.toLowerCase() === normalizedSkill.toLowerCase();
  });

  const packageJson = analysis.packageJson || {};
  const dependencyNames = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {}),
    ...Object.keys(packageJson.peerDependencies || {}),
  ];

  const depMatch = dependencyNames.some((depName: string) => {
    const depValue = depName.toLowerCase();
    const normalizedDep = normalizeSkillName(depName);
    return normalizedDep.toLowerCase() === normalizedSkill.toLowerCase() || depValue.includes(normalizedSkill.toLowerCase());
  });

  const readmeText = (analysis.readmeText || "").toLowerCase();
  const readmeMatch = readmeText.includes(normalizedSkill.toLowerCase()) ||
    (analysis.description || "").toLowerCase().includes(normalizedSkill.toLowerCase());

  const testsDetected = Boolean(
    analysis.testEvidence ||
    (typeof analysis.packageJson === "object" && (
      Object.keys(analysis.packageJson.devDependencies || {}).some((dependency) => /jest|vitest|cypress|playwright|mocha|pytest/.test(dependency)) ||
      Object.keys(analysis.packageJson.dependencies || {}).some((dependency) => /jest|vitest|cypress|playwright|mocha|pytest/.test(dependency))
    ))
  );

  const recentActivity = Boolean(analysis.recentCommitWithin90Days || analysis.commitsLast90Days > 0 || analysis.updatedWithin90Days);
  const deploymentEvidence = Boolean(analysis.hasDeploymentConfig || analysis.deploymentUrl || analysis.hasDockerfile || analysis.hasVercelConfig);

  if (hasLanguageEvidence) {
    reasons.push(`Language usage detected in ${analysis.name}`);
    languages.push(...repoSkills.filter((language: string) => normalizeSkillName(language).toLowerCase() === normalizedSkill.toLowerCase()));
  }
  if (depMatch) {
    reasons.push(`Framework or dependency matches in ${analysis.name}`);
  }
  if (readmeMatch) {
    reasons.push(`README or project description references ${normalizedSkill}`);
  }
  if (testsDetected) {
    reasons.push(`Testing setup found for the stack in ${analysis.name}`);
  }
  if (recentActivity) {
    reasons.push(`Recent repository activity indicates continued use`);
  }
  if (deploymentEvidence) {
    reasons.push(`Deployment artifact or publish config detected`);
  }

  return {
    matched: hasLanguageEvidence || depMatch || readmeMatch,
    reasons,
    languages,
    testsDetected,
    recentActivity,
    deploymentEvidence,
  };
}

export async function analyzeGitHubForSkills(username: string, claimedSkills: string[]): Promise<{
  profile: any;
  repositories: any[];
  skills: SkillClaim[];
  overallCoverage: number;
}> {
  const cleanUsername = (username || "").trim();
  if (!cleanUsername || !/^[A-Za-z0-9-]+$/.test(cleanUsername)) {
    throw new Error("GitHub username is invalid.");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "CareerOS-SkillProof",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const profileResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, { headers, cache: "no-store" });
  if (!profileResponse.ok) {
    const body = await profileResponse.json().catch(() => ({}));
    throw new Error(body.message || "GitHub profile not found.");
  }

  const profile = await profileResponse.json();

  const reposResponse = await fetch(
    `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated`,
    { headers, cache: "no-store" }
  );

  if (!reposResponse.ok) {
    throw new Error("GitHub repositories could not be loaded.");
  }

  const repos = await reposResponse.json();
  const activeRepos = (Array.isArray(repos) ? repos : [])
    .filter((repo: any) => !repo.fork && !repo.archived)
    .sort((a: any, b: any) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, 8);

  const repositoryAnalyses = await Promise.all(
    activeRepos.map(async (repo: any) => {
      const owner = repo.owner?.login || cleanUsername;
      const defaultBranch = repo.default_branch || "main";

      const [languagesResponse, readmeResponse, commitsResponse] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo.name}/languages`, { headers, cache: "no-store" }).catch(() => null),
        fetch(`https://api.github.com/repos/${owner}/${repo.name}/readme`, { headers, cache: "no-store" }).catch(() => null),
        fetch(`https://api.github.com/repos/${owner}/${repo.name}/commits?per_page=10`, { headers, cache: "no-store" }).catch(() => null),
      ]);

      let readmeText = "";
      if (readmeResponse && readmeResponse.ok) {
        const readmeJson = await readmeResponse.json().catch(() => null);
        if (readmeJson?.content) {
          readmeText = Buffer.from(readmeJson.content, "base64").toString("utf8");
        }
      }

      const languagesData = languagesResponse && languagesResponse.ok ? await languagesResponse.json().catch(() => ({})) : {};
      const languages = Object.keys(languagesData || {});
      const commits = commitsResponse && commitsResponse.ok ? await commitsResponse.json().catch(() => []) : [];
      const recentCommitDate = commits[0]?.commit?.author?.date || repo.pushed_at || null;
      const recentCommitWithin90Days = recentCommitDate ? new Date(recentCommitDate).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000 : false;

      let packageJson: Record<string, any> = {};
      const packageJsonResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo.name}/${defaultBranch}/package.json`, { cache: "no-store" }).catch(() => null);
      if (packageJsonResponse && packageJsonResponse.ok) {
        try {
          packageJson = await packageJsonResponse.json();
        } catch {
          packageJson = {};
        }
      }

      const hasVercelConfig = Boolean(
        repo.homepage || /vercel|netlify|render|fly.io|railway|heroku/i.test(readmeText) || /vercel|netlify/.test(JSON.stringify(packageJson || {}))
      );
      const hasDeploymentConfig = Boolean(repo.has_pages || hasVercelConfig || /docker|deploy/.test(readmeText) || /docker/i.test(JSON.stringify(packageJson || {})));
      const describeText = `${repo.description || ""} ${readmeText}`;
      const testEvidence = Boolean(/jest|vitest|cypress|playwright|pytest|mocha|testing-library/.test(describeText));

      return {
        ...repo,
        languages,
        readmeText,
        packageJson,
        testEvidence,
        commitsLast90Days: Array.isArray(commits) ? commits.filter((commit: any) => {
          const date = commit.commit?.author?.date;
          return date && new Date(date).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000;
        }).length : 0,
        recentCommitWithin90Days,
        updatedWithin90Days: repo.updated_at ? new Date(repo.updated_at).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000 : false,
        hasDeploymentConfig,
        hasDockerfile: /docker/i.test(readmeText) || /docker/i.test(JSON.stringify(packageJson)),
        deploymentUrl: repo.homepage || null,
      };
    })
  );

  const skillClaims: SkillClaim[] = (claimedSkills.length > 0 ? claimedSkills : ["Python", "JavaScript", "React"]).map((skill) => {
    const matches = repositoryAnalyses
      .map((analysis) => repoSupportsSkill(skill, analysis))
      .filter((report) => report.matched);

    const evidenceSummary = matches.length > 0 ? matches.flatMap((report) => report.reasons).slice(0, 5) : ["No repository evidence found for this skill." ];
    const repoEvidence: GitHubRepoEvidence[] = repositoryAnalyses
      .filter((analysis) => repoSupportsSkill(skill, analysis).matched)
      .map((analysis) => {
        const result = repoSupportsSkill(skill, analysis);
        return {
          name: analysis.name,
          url: analysis.html_url,
          language: analysis.language,
          updatedAt: analysis.updated_at,
          readmeUrl: analysis.html_url ? `${analysis.html_url}#readme` : undefined,
          commitsUrl: analysis.html_url ? `${analysis.html_url}/commits` : undefined,
          languages: analysis.languages || [],
          reasons: result.reasons,
          testsDetected: result.testsDetected,
          recentActivity: result.recentActivity,
          deploymentEvidence: result.deploymentEvidence,
        };
      });

    const evidenceScore = matches.reduce((score, current) => {
      let currentScore = 0;
      if (current.matched) currentScore += 2;
      if (current.testsDetected) currentScore += 2;
      if (current.recentActivity) currentScore += 1;
      if (current.deploymentEvidence) currentScore += 1;
      return score + currentScore;
    }, 0);

    let verdict: SkillVerdict = "CLAIMED_ONLY";
    let strength: EvidenceStrength = "WEAK";

    if (evidenceScore >= 6 && repoEvidence.length > 1) {
      verdict = "PROVEN";
      strength = "STRONG";
    } else if (evidenceScore >= 3 && repoEvidence.length > 0) {
      verdict = "PARTIAL";
      strength = "PARTIAL";
    } else if (repoEvidence.length === 0) {
      verdict = "CLAIMED_ONLY";
      strength = "WEAK";
    }

    const evidenceLinks: EvidenceLink[] = repoEvidence.slice(0, 3).flatMap((repo) => [
      { label: `View ${repo.name}`, url: repo.url },
      ...(repo.readmeUrl ? [{ label: `Readme`, url: repo.readmeUrl }] : []),
      ...(repo.commitsUrl ? [{ label: `Commits`, url: repo.commitsUrl }] : []),
    ]);

    return {
      skill,
      claimedLevel: "Resume claim",
      source: "resume",
      verdict,
      evidenceStrength: strength,
      evidenceSummary,
      evidenceLinks: evidenceLinks.length > 0 ? evidenceLinks : [{ label: "No public evidence found", url: "#" }],
      whatItSupports:
        verdict === "PROVEN"
          ? `Observed repository evidence shows this skill was used in real code, with supporting tests and recent activity.`
          : verdict === "PARTIAL"
            ? `There is partial repository evidence for this skill, but it is limited or older.`
            : `No strong public evidence was found to support the resume claim.`,
      whatItDoesNotProve:
        verdict === "PROVEN"
          ? `This does not prove professional mastery or flawless production-level expertise; it only indicates evidence of usage in public repositories.`
          : `It does not confirm independent mastery, complete confidence, or production readiness for this skill stack.`,
      repositoryCount: repoEvidence.length,
      repositoryEvidence: repoEvidence,
    };
  });

  const overallCoverage = Math.min(
    100,
    Math.round(
      (skillClaims.filter((skill) => skill.verdict === "PROVEN").length / Math.max(skillClaims.length, 1)) * 100
    )
  );

  return {
    profile,
    repositories: repositoryAnalyses,
    skills: skillClaims,
    overallCoverage,
  };
}

export function buildJobReadinessReport(skills: SkillClaim[], jobDescription: string): JobRequirementReport {
  const requiredSkills = extractSkillKeywords(jobDescription, []);

  const supportedSkills = requiredSkills
    .map((skillName) => {
      const candidate = skills.find((skill) => matchSkillAlias(skill.skill, skillName));
      if (!candidate) {
        return { skill: skillName, verdict: "CLAIMED_ONLY" as SkillVerdict, evidenceStrength: "WEAK" as EvidenceStrength, evidenceLinks: [] as EvidenceLink[] };
      }
      return {
        skill: skillName,
        verdict: candidate.verdict,
        evidenceStrength: candidate.evidenceStrength,
        evidenceLinks: candidate.evidenceLinks,
      };
    })
    .filter((item) => item.verdict === "PROVEN" || item.verdict === "PARTIAL");

  const insufficientEvidence = requiredSkills.filter((skillName) => {
    const candidate = skills.find((skill) => matchSkillAlias(skill.skill, skillName));
    return candidate ? candidate.verdict === "PARTIAL" || candidate.verdict === "CLAIMED_ONLY" : true;
  });

  const missingRequirements = requiredSkills.filter((skillName) => {
    const candidate = skills.find((skill) => matchSkillAlias(skill.skill, skillName));
    return !candidate || candidate.verdict === "CLAIMED_ONLY";
  });

  const skillGaps: SkillGap[] = [...new Set([...insufficientEvidence, ...missingRequirements])].map((skillName) => {
    const candidate = skills.find((skill) => matchSkillAlias(skill.skill, skillName));
    const microtask = generateMicroTask(skillName);
    return {
      skill: skillName,
      required: true,
      verdict: candidate?.verdict || "CLAIMED_ONLY",
      evidenceStrength: candidate?.evidenceStrength || "WEAK",
      evidenceLinks: candidate?.evidenceLinks || [],
      microtask: microtask.task,
      estimatedTime: microtask.estimatedTime,
      expectedEvidence: microtask.expectedEvidence,
    };
  });

  const matchScore = requiredSkills.length > 0
    ? Math.max(0, Math.min(100, Math.round((supportedSkills.length / requiredSkills.length) * 100)))
    : 0;

  return {
    matchScore,
    requiredSkills,
    supportedSkills: supportedSkills.map((item) => item.skill),
    insufficientEvidence,
    missingRequirements,
    skillGaps,
  };
}

export function generateMicroTask(skillName: string): { task: string; estimatedTime: string; expectedEvidence: string[] } {
  const normalized = normalizeSkillName(skillName);

  const taskMap: Record<string, { task: string; estimatedTime: string; expectedEvidence: string[] }> = {
    Docker: {
      task: "Containerize a small Node.js or Python service using Docker and document the run steps in a README.",
      estimatedTime: "60-90 minutes",
      expectedEvidence: ["Dockerfile", "running container", "README instructions", "GitHub repository"],
    },
    AWS: {
      task: "Deploy a simple application to AWS and share the live URL along with infrastructure notes.",
      estimatedTime: "90-120 minutes",
      expectedEvidence: ["deployment URL", "AWS configuration", "README", "working app"],
    },
    React: {
      task: "Build a reusable React component with state handling and clear UI feedback for a practical feature.",
      estimatedTime: "45-75 minutes",
      expectedEvidence: ["component code", "UI screenshot", "GitHub repo", "README"],
    },
    "Node.js": {
      task: "Create and test a REST API endpoint with validation and a lightweight database integration.",
      estimatedTime: "60-90 minutes",
      expectedEvidence: ["API code", "test coverage", "README", "GitHub repo"],
    },
    Python: {
      task: "Build a tiny data processing script with tests and a documented setup flow.",
      estimatedTime: "45-75 minutes",
      expectedEvidence: ["Python source", "pytest run", "README", "GitHub repo"],
    },
    MongoDB: {
      task: "Connect an app to MongoDB, write a CRUD flow, and document the schema and setup steps.",
      estimatedTime: "60-90 minutes",
      expectedEvidence: ["Mongo connection config", "CRUD code", "README", "working sample data"],
    },
    TypeScript: {
      task: "Refactor a small project to add strong typing and validation for a real feature surface.",
      estimatedTime: "45-60 minutes",
      expectedEvidence: ["typed interfaces", "code review", "working app", "README"],
    },
  };

  const fallback = {
    task: `Build a small project or feature that demonstrates practical use of ${normalized} with a working implementation and clear documentation.`,
    estimatedTime: "45-90 minutes",
    expectedEvidence: ["project code", "working implementation", "README", "GitHub repository"],
  };

  return taskMap[normalized] || fallback;
}

export function computeOverallCoverage(skills: SkillClaim[]) {
  if (!skills.length) return 0;
  const provenCount = skills.filter((skill) => skill.verdict === "PROVEN").length;
  return Math.min(100, Math.round((provenCount / skills.length) * 100));
}
