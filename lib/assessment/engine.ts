import { TARGET_ROLES, RoleDefinition } from "./roles";
import { generateContent } from "@/lib/ai/gemini";

export type SkillClassification = "PROVEN" | "PARTIAL" | "CLAIMED-ONLY";

export type RoleRelevance = "CORE" | "RELEVANT" | "NOT_REQUIRED";

export interface EvidenceCitation {
  type: "language" | "test_suite" | "ci_workflow" | "deployment_config" | "package_manifest" | "commit" | "repository";
  title: string;
  repoName: string;
  repoUrl: string;
  filePath?: string;
  fileUrl?: string;
  description: string;
}

export interface SkillEvidenceAssessment {
  skill: string;
  classification: SkillClassification;
  roleRelevance: RoleRelevance;
  isRoleRelevant: boolean; // backward compatibility: true if roleRelevance !== "NOT_REQUIRED"
  hasPublicEvidence: boolean; // backward compatibility: true if classification !== "CLAIMED-ONLY"
  evidenceCount: number;
  explanation: string;
  nextStep: string;
  citations: EvidenceCitation[];
  summary: string;
}

export interface AssessmentResult {
  id: string;
  targetRole: {
    name: string;
    description: string;
    category: string;
    coreSkillKeywords: string[];
    relevantSkillKeywords?: string[];
    evidenceFocus: string[];
  };
  githubUsername: string;
  assessedAt: string;
  metrics: {
    totalClaimedSkills: number;
    provenSkillsCount: number;
    partialSkillsCount: number;
    claimedOnlySkillsCount: number;
    skillsWithPublicEvidence: number;
    skillsWithoutPublicEvidence: number;
    roleRelevantSkillsClaimed: number;
    roleRelevantSkillsWithEvidence: number;
    evidenceCoveragePercentage: number;
    totalInspectedRepos: number;
    totalTestSuites: number;
    totalCIWorkflows: number;
    totalDeploymentConfigs: number;
    totalVerifiedCommits: number;
  };
  skills: SkillEvidenceAssessment[];
  unclaimedRoleSkills: string[];
  roleInsights: {
    observedStrengths: string[];
    evidenceOpportunities: string[];
    summary: string;
  };
  notice: string;
}

/**
 * Normalizes strings for robust keyword matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[-_./,\\]/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Strict skill keyword matcher preventing false positives from substrings
 * (e.g., 'Java' vs 'JavaScript', 'C' vs 'C++', 'R' vs 'React').
 */
export function isSkillMatch(skill: string, keyword: string): boolean {
  if (!skill || !keyword) return false;

  const rawSkillLower = skill.toLowerCase().trim();
  const rawKeyLower = keyword.toLowerCase().trim();

  // 1. Exact raw match
  if (rawSkillLower === rawKeyLower) return true;

  // 2. Normalized token match
  const normSkill = normalizeText(skill);
  const normKey = normalizeText(keyword);
  if (normSkill === normKey) return true;

  const normSkillStrict = normSkill.replace(/\s+/g, "");
  const normKeyStrict = normKey.replace(/\s+/g, "");
  if (normSkillStrict === normKeyStrict) return true;

  // 3. Strict Guardrails for easily collided short tokens
  // C vs C++ vs C# vs CSS vs CI/CD
  if (normSkillStrict === "c" && normKeyStrict !== "c") return false;
  if (normKeyStrict === "c" && normSkillStrict !== "c") return false;

  // Java vs JavaScript
  if (normSkillStrict === "java" && normKeyStrict.includes("javascript")) return false;
  if (normKeyStrict === "java" && normSkillStrict.includes("javascript")) return false;

  // R vs React vs Redux vs Rust vs Ruby
  if (normSkillStrict === "r" && normKeyStrict !== "r") return false;
  if (normKeyStrict === "r" && normSkillStrict !== "r") return false;

  // Go vs Golang
  if ((normSkillStrict === "go" || normSkillStrict === "golang") && (normKeyStrict === "go" || normKeyStrict === "golang")) {
    return true;
  }

  // 4. Comprehensive Explicit Aliases
  const aliases: Record<string, string[]> = {
    js: ["javascript", "ecmascript"],
    javascript: ["js", "ecmascript"],
    ts: ["typescript"],
    typescript: ["ts"],
    react: ["reactjs", "react.js", "react framework"],
    reactjs: ["react", "react.js"],
    "react.js": ["react", "reactjs"],
    "next.js": ["nextjs", "next"],
    nextjs: ["next.js", "next"],
    "vue.js": ["vue", "vuejs"],
    vuejs: ["vue", "vue.js"],
    node: ["nodejs", "node.js"],
    nodejs: ["node", "node.js"],
    "node.js": ["node", "nodejs"],
    py: ["python"],
    python: ["py"],
    golang: ["go"],
    go: ["golang"],
    k8s: ["kubernetes"],
    kubernetes: ["k8s"],
    postgres: ["postgresql", "psql"],
    postgresql: ["postgres", "psql"],
    psql: ["postgres", "postgresql"],
    mongo: ["mongodb"],
    mongodb: ["mongo"],
    "tailwind css": ["tailwind", "tailwindcss"],
    tailwindcss: ["tailwind", "tailwind css"],
    tailwind: ["tailwind css", "tailwindcss"],
    ci: ["cicd", "ci/cd", "continuous integration", "github actions"],
    "ci/cd": ["ci", "cicd", "continuous integration", "github actions"],
    cicd: ["ci", "ci/cd", "continuous integration", "github actions"],
    docker: ["containerization", "containers"],
    tf: ["terraform"],
    terraform: ["tf"],
    aws: ["amazon web services", "amazon cloud", "ec2", "s3", "lambda"],
    "amazon web services": ["aws"],
    gcp: ["google cloud", "google cloud platform"],
    "google cloud": ["gcp", "google cloud platform"],
    azure: ["microsoft azure"],
    git: ["github", "gitlab", "version control"],
    sql: ["mysql", "postgresql", "postgres", "sqlite", "relational database", "rdbms"],
    "c++": ["cpp", "cplusplus", "c plus plus"],
    cpp: ["c++", "cplusplus"],
    "c#": ["csharp", "cs", "c sharp"],
    csharp: ["c#", "cs"],
    dotnet: [".net", "net core", "aspnet"],
    ".net": ["dotnet", "net core", "aspnet"],
    html: ["html5"],
    html5: ["html"],
    css: ["css3"],
    css3: ["css"],
    rest: ["rest api", "restful", "restful api", "restful apis"],
    "rest api": ["rest", "restful", "restful api"],
    graphql: ["gql", "apollo"],
  };

  if (aliases[rawSkillLower]?.includes(rawKeyLower) || aliases[rawKeyLower]?.includes(rawSkillLower)) {
    return true;
  }

  if (aliases[normSkillStrict]?.includes(normKeyStrict) || aliases[normKeyStrict]?.includes(normSkillStrict)) {
    return true;
  }

  // 5. Whole word phrase matching (e.g. "Tailwind" inside "Tailwind CSS", but NOT "Java" inside "JavaScript")
  if (normSkill.length >= 3 && normKey.length >= 3) {
    const skillWords = normSkill.split(" ");
    const keyWords = normKey.split(" ");

    if (keyWords.length > 1 && keyWords.includes(normSkill)) return true;
    if (skillWords.length > 1 && skillWords.includes(normKey)) return true;
  }

  return false;
}

/**
 * Calculates role relevance (CORE, RELEVANT, NOT_REQUIRED)
 */
export function calculateRoleRelevance(skill: string, role: RoleDefinition): RoleRelevance {
  const isCore = role.coreSkillKeywords.some((kw) => isSkillMatch(skill, kw));
  if (isCore) return "CORE";

  if (role.relevantSkillKeywords && role.relevantSkillKeywords.length > 0) {
    const isRelevant = role.relevantSkillKeywords.some((kw) => isSkillMatch(skill, kw));
    if (isRelevant) return "RELEVANT";
  }

  return "NOT_REQUIRED";
}

/**
 * Deterministically classifies evidence strength into PROVEN, PARTIAL, or CLAIMED-ONLY
 */
export function classifySkillEvidence(params: {
  skill: string;
  citations: EvidenceCitation[];
  languagesList: any[];
}): {
  classification: SkillClassification;
  explanation: string;
  nextStep: string;
} {
  const { skill, citations, languagesList } = params;

  if (citations.length === 0) {
    return {
      classification: "CLAIMED-ONLY",
      explanation: `Claimed on resume, but no public repository code, language footprints, or commit records were observed for this skill in accessible repositories.`,
      nextStep: `Publish or pin a public GitHub repository, demo, or code sample showcasing hands-on work with ${skill}.`,
    };
  }

  const hasTestSuite = citations.some((c) => c.type === "test_suite");
  const hasCIWorkflow = citations.some((c) => c.type === "ci_workflow");
  const hasDeploymentConfig = citations.some((c) => c.type === "deployment_config");
  const hasVerifiedCommit = citations.some((c) => c.type === "commit");
  const hasPackageManifest = citations.some((c) => c.type === "package_manifest");
  const hasRepository = citations.some((c) => c.type === "repository");

  // Check language footprint size
  let totalLanguageBytes = 0;
  let totalLanguagePercentage = 0;

  languagesList.forEach((lang) => {
    if (isSkillMatch(skill, lang.name)) {
      totalLanguageBytes += lang.bytes || 0;
      totalLanguagePercentage += lang.percentage || 0;
    }
  });

  const hasSubstantialLanguage = totalLanguageBytes >= 2000 || totalLanguagePercentage >= 5;
  const hasMinorLanguage = totalLanguageBytes > 0 && !hasSubstantialLanguage;

  // 1. PROVEN Conditions:
  // - Substantial codebase language footprint (>=2000 bytes or >=5%)
  // - Automated test suite file
  // - Verified commit authoring
  // - CI workflow for CI/CD/DevOps skills
  // - Deployment configuration for Docker/Kubernetes/Terraform
  // - Package manifest confirmed by another supporting evidence artifact
  const isProven =
    hasSubstantialLanguage ||
    hasTestSuite ||
    hasVerifiedCommit ||
    (hasCIWorkflow && isSkillMatch(skill, "ci/cd")) ||
    (hasDeploymentConfig && (isSkillMatch(skill, "docker") || isSkillMatch(skill, "kubernetes") || isSkillMatch(skill, "terraform"))) ||
    (hasPackageManifest && (hasMinorLanguage || hasRepository || citations.length >= 2));

  if (isProven) {
    const evidenceTypes = Array.from(new Set(citations.map((c) => c.type.replace(/_/g, " ")))).join(", ");
    return {
      classification: "PROVEN",
      explanation: `Verified through ${citations.length} direct code artifact(s) (${evidenceTypes}) across inspected public repositories.`,
      nextStep: `Maintain active contributions and continue adding automated tests to strengthen public verification.`,
    };
  }

  // 2. PARTIAL Conditions:
  // - Minor language footprint (<2000 bytes)
  // - Package manifest declared without direct tests or verified commits
  // - Repository topic or title mention without deep implementation
  const partialTypes = Array.from(new Set(citations.map((c) => c.type.replace(/_/g, " ")))).join(", ");
  
  let nextStepSuggestion = `Add automated test suites or implement a dedicated feature using ${skill} in a public repository.`;
  if (hasPackageManifest) {
    nextStepSuggestion = `Dependency is configured in manifest; add unit/integration tests and implementation code to elevate to PROVEN.`;
  } else if (hasMinorLanguage) {
    nextStepSuggestion = `Expand your codebase footprint in ${skill} with comprehensive feature implementations.`;
  }

  return {
    classification: "PARTIAL",
    explanation: `Preliminary evidence observed (${partialTypes}), but insufficient direct test coverage or code volume to satisfy full verification criteria.`,
    nextStep: nextStepSuggestion,
  };
}

/**
 * Runs the deterministic Evidence-Based Skill Assessment and Classification engine
 */
export async function runSkillEvidenceAssessment(params: {
  resumeSkills: string[];
  githubData: any;
  targetRoleName: string;
  githubUsername: string;
}): Promise<AssessmentResult> {
  const { resumeSkills, githubData, targetRoleName, githubUsername } = params;

  // 1. Find or synthesize Role Definition
  const matchedRole = TARGET_ROLES.find(
    (r) =>
      r.name.toLowerCase() === targetRoleName.toLowerCase() ||
      r.id === targetRoleName.toLowerCase()
  ) || {
    id: "custom-role",
    name: targetRoleName,
    category: "Engineering" as const,
    description: `Target career path for ${targetRoleName}`,
    coreSkillKeywords: targetRoleName
      .toLowerCase()
      .split(/[\s,/]+/)
      .filter((w) => w.length > 2),
    relevantSkillKeywords: ["git", "docker", "ci/cd", "testing", "rest api"],
    evidenceFocus: ["Code repositories", "Project tests", "Documentation", "Deployment setup"],
  };

  // 2. Extract inspected repositories and public evidence from GitHub data
  const topRepos: any[] = githubData?.projects?.topRepos || [];
  const languagesList: any[] = githubData?.languages?.languages || [];

  let totalTestSuites = 0;
  let totalCIWorkflows = 0;
  let totalDeploymentConfigs = 0;
  let totalVerifiedCommits = 0;

  topRepos.forEach((repo) => {
    if (repo.evidence) {
      totalTestSuites += repo.evidence.tests?.length || 0;
      totalCIWorkflows += repo.evidence.ciWorkflows?.length || 0;
      totalDeploymentConfigs += repo.evidence.deploymentConfigs?.length || 0;
      totalVerifiedCommits += repo.evidence.recentCommits?.length || 0;
    }
  });

  // 3. Evaluate each claimed resume skill against GitHub evidence
  const assessedSkills: SkillEvidenceAssessment[] = [];

  for (const rawSkill of resumeSkills) {
    const skill = rawSkill.trim();
    if (!skill) continue;

    const roleRelevance = calculateRoleRelevance(skill, matchedRole);
    const isRoleRelevant = roleRelevance !== "NOT_REQUIRED";

    const citations: EvidenceCitation[] = [];

    // Search languages
    languagesList.forEach((lang) => {
      if (isSkillMatch(skill, lang.name)) {
        citations.push({
          type: "language",
          title: `${lang.name} codebase usage (${lang.percentage}% of scanned code)`,
          repoName: "Account-wide Languages",
          repoUrl: `https://github.com/${githubUsername}`,
          description: `Direct language footprint observed across public repositories with ${lang.bytes.toLocaleString()} bytes.`,
        });
      }
    });

    // Search repositories & deep evidence
    topRepos.forEach((repo) => {
      const repoName = repo.name;
      const repoUrl = repo.url;
      const defaultBranch = repo.evidence?.defaultBranch || "main";

      // Match primary language or repo topics
      if (repo.language && isSkillMatch(skill, repo.language)) {
        citations.push({
          type: "repository",
          title: `Primary language in repository "${repoName}"`,
          repoName,
          repoUrl,
          description: `Repository ${repoName} is primarily developed in ${repo.language}.`,
        });
      }

      if (Array.isArray(repo.topics)) {
        repo.topics.forEach((topic: string) => {
          if (isSkillMatch(skill, topic)) {
            citations.push({
              type: "repository",
              title: `Repository topic tag: #${topic}`,
              repoName,
              repoUrl,
              description: `Tagged with topic #${topic} indicating focused project domain.`,
            });
          }
        });
      }

      // Check package manifests & dependencies
      if (repo.evidence?.packageManifests) {
        repo.evidence.packageManifests.forEach((pm: any) => {
          if (
            isSkillMatch(skill, pm.ecosystem) ||
            isSkillMatch(skill, pm.name) ||
            (pm.name === "package.json" && (isSkillMatch(skill, "javascript") || isSkillMatch(skill, "typescript") || isSkillMatch(skill, "node.js"))) ||
            (pm.name === "requirements.txt" && isSkillMatch(skill, "python")) ||
            (pm.name === "Cargo.toml" && isSkillMatch(skill, "rust")) ||
            (pm.name === "go.mod" && isSkillMatch(skill, "go"))
          ) {
            citations.push({
              type: "package_manifest",
              title: `${pm.name} (${pm.ecosystem})`,
              repoName,
              repoUrl,
              filePath: pm.path,
              fileUrl: pm.url || `${repoUrl}/blob/${defaultBranch}/${pm.path}`,
              description: `Configured build/package manifest in ${repoName}.`,
            });
          }
        });
      }

      // Check test suites
      if (repo.evidence?.tests) {
        repo.evidence.tests.forEach((test: any) => {
          const testIdentifier = (test.name || test.path || "").toLowerCase();
          if (
            isSkillMatch(skill, "testing") ||
            isSkillMatch(skill, "unit test") ||
            isSkillMatch(skill, "jest") ||
            isSkillMatch(skill, "pytest") ||
            (test.framework && isSkillMatch(skill, test.framework)) ||
            (testIdentifier.endsWith(".ts") && isSkillMatch(skill, "typescript")) ||
            (testIdentifier.endsWith(".tsx") && (isSkillMatch(skill, "react") || isSkillMatch(skill, "typescript"))) ||
            (testIdentifier.endsWith(".jsx") && (isSkillMatch(skill, "react") || isSkillMatch(skill, "javascript"))) ||
            (testIdentifier.endsWith(".py") && isSkillMatch(skill, "python")) ||
            (testIdentifier.endsWith(".go") && isSkillMatch(skill, "go"))
          ) {
            citations.push({
              type: "test_suite",
              title: `Test suite file: ${test.name || test.path || "test artifact"}`,
              repoName,
              repoUrl,
              filePath: test.path,
              fileUrl: test.url || `${repoUrl}/blob/${defaultBranch}/${test.path || ""}`,
              description: `Automated test artifact${test.framework ? ` (${test.framework})` : ""} in ${repoName}.`,
            });
          }
        });
      }

      // Check CI workflows
      if (repo.evidence?.ciWorkflows) {
        repo.evidence.ciWorkflows.forEach((ci: any) => {
          if (
            isSkillMatch(skill, "ci/cd") ||
            isSkillMatch(skill, "ci") ||
            isSkillMatch(skill, "github actions") ||
            isSkillMatch(skill, "devops")
          ) {
            citations.push({
              type: "ci_workflow",
              title: `GitHub Actions workflow: ${ci.name || ci.path || "workflow"}`,
              repoName,
              repoUrl,
              filePath: ci.path,
              fileUrl: ci.url || `${repoUrl}/blob/${defaultBranch}/${ci.path || ""}`,
              description: `Automated CI workflow defined in ${repoName}.`,
            });
          }
        });
      }

      // Check deployment configs
      if (repo.evidence?.deploymentConfigs) {
        repo.evidence.deploymentConfigs.forEach((dep: any) => {
          if (
            isSkillMatch(skill, "docker") ||
            isSkillMatch(skill, "kubernetes") ||
            isSkillMatch(skill, "devops") ||
            (dep.type && isSkillMatch(skill, dep.type))
          ) {
            citations.push({
              type: "deployment_config",
              title: `Deployment artifact: ${dep.name || dep.path || "config"}${dep.type ? ` (${dep.type})` : ""}`,
              repoName,
              repoUrl,
              filePath: dep.path,
              fileUrl: dep.url || `${repoUrl}/blob/${defaultBranch}/${dep.path || ""}`,
              description: `Deployment configuration in ${repoName}.`,
            });
          }
        });
      }

      // Check recent commits
      if (repo.evidence?.recentCommits) {
        repo.evidence.recentCommits.forEach((commit: any) => {
          if (commit.message && isSkillMatch(skill, commit.message)) {
            const shortSha = commit.shortSha || commit.sha?.slice(0, 7) || "commit";
            citations.push({
              type: "commit",
              title: `Commit [${shortSha}]: ${commit.message.substring(0, 50)}`,
              repoName,
              repoUrl,
              fileUrl: commit.url || (commit.sha ? `${repoUrl}/commit/${commit.sha}` : undefined),
              description: `Author-verified commit in ${repoName} on ${commit.date ? new Date(commit.date).toLocaleDateString() : "recent"}.`,
            });
          }
        });
      }
    });

    // Deduplicate citations by title & repo
    const uniqueCitations = citations.filter(
      (c, idx, self) =>
        idx === self.findIndex((o) => o.title === c.title && o.repoName === c.repoName)
    );

    // Run Feature 2 Classification
    const classificationResult = classifySkillEvidence({
      skill,
      citations: uniqueCitations,
      languagesList,
    });

    assessedSkills.push({
      skill,
      classification: classificationResult.classification,
      roleRelevance,
      isRoleRelevant,
      hasPublicEvidence: classificationResult.classification !== "CLAIMED-ONLY",
      evidenceCount: uniqueCitations.length,
      explanation: classificationResult.explanation,
      nextStep: classificationResult.nextStep,
      citations: uniqueCitations,
      summary: classificationResult.explanation,
    });
  }

  // 4. Identify unclaimed target role skills
  const unclaimedRoleSkills = matchedRole.coreSkillKeywords.filter(
    (kw) => !resumeSkills.some((rs) => isSkillMatch(rs, kw))
  );

  // 5. Aggregate metrics with Feature 2 counts
  const totalClaimedSkills = assessedSkills.length;
  const provenSkillsCount = assessedSkills.filter((s) => s.classification === "PROVEN").length;
  const partialSkillsCount = assessedSkills.filter((s) => s.classification === "PARTIAL").length;
  const claimedOnlySkillsCount = assessedSkills.filter((s) => s.classification === "CLAIMED-ONLY").length;
  const skillsWithPublicEvidence = provenSkillsCount + partialSkillsCount;
  const skillsWithoutPublicEvidence = claimedOnlySkillsCount;

  const roleRelevantSkills = assessedSkills.filter((s) => s.isRoleRelevant);
  const roleRelevantSkillsClaimed = roleRelevantSkills.length;
  const roleRelevantSkillsWithEvidence = roleRelevantSkills.filter((s) => s.hasPublicEvidence).length;

  // Evidence coverage percentage: weighted coverage (PROVEN = 100%, PARTIAL = 50%)
  const evidenceCoveragePercentage =
    totalClaimedSkills > 0
      ? Math.round(((provenSkillsCount + partialSkillsCount * 0.5) / totalClaimedSkills) * 100)
      : 0;

  // 6. Formulate deterministic role insights
  const observedStrengths: string[] = [];
  const evidenceOpportunities: string[] = [];

  const provenRoleSkills = roleRelevantSkills
    .filter((s) => s.classification === "PROVEN")
    .map((s) => s.skill);

  const partialRoleSkills = roleRelevantSkills
    .filter((s) => s.classification === "PARTIAL")
    .map((s) => s.skill);

  const claimedOnlyRoleSkills = roleRelevantSkills
    .filter((s) => s.classification === "CLAIMED-ONLY")
    .map((s) => s.skill);

  if (provenRoleSkills.length > 0) {
    observedStrengths.push(
      `Strong public verification (PROVEN) for core ${matchedRole.name} skills: ${provenRoleSkills.slice(0, 4).join(", ")}.`
    );
  }

  if (totalTestSuites > 0) {
    observedStrengths.push(
      `Automated test suites identified across public repositories (${totalTestSuites} test files inspected).`
    );
  }

  if (totalCIWorkflows > 0 || totalDeploymentConfigs > 0) {
    observedStrengths.push(
      `CI/CD and deployment configurations verified (${totalCIWorkflows} CI workflows, ${totalDeploymentConfigs} deployment configs).`
    );
  }

  if (partialRoleSkills.length > 0) {
    evidenceOpportunities.push(
      `Elevate ${partialRoleSkills.slice(0, 3).join(", ")} from PARTIAL to PROVEN by adding dedicated test suites or direct implementations.`
    );
  }

  if (claimedOnlyRoleSkills.length > 0) {
    evidenceOpportunities.push(
      `Resume lists ${claimedOnlyRoleSkills.slice(0, 3).join(", ")} without public GitHub code citations. Publishing sample projects or pinning repositories will strengthen your portfolio.`
    );
  }

  if (unclaimedRoleSkills.length > 0) {
    evidenceOpportunities.push(
      `Key ${matchedRole.name} competencies not listed on resume: ${unclaimedRoleSkills.slice(0, 3).join(", ")}.`
    );
  }

  let summaryText = `Evidence-based skill assessment completed for the **${matchedRole.name}** role across ${totalClaimedSkills} claimed skills. Found ${provenSkillsCount} PROVEN, ${partialSkillsCount} PARTIAL, and ${claimedOnlySkillsCount} CLAIMED-ONLY skills across ${topRepos.length} inspected public repositories.`;

  // 7. Optional AI Qualitative Synthesis (with safe deterministic fallback)
  try {
    const aiPrompt = `You are an expert technical recruiter analyzing evidence classifications for a candidate targeting "${matchedRole.name}".
Proven skills: ${provenRoleSkills.slice(0, 8).join(", ") || "None"}
Partial skills: ${partialRoleSkills.slice(0, 8).join(", ") || "None"}
Claimed-only skills: ${claimedOnlyRoleSkills.slice(0, 8).join(", ") || "None"}
Inspected repos: ${topRepos.length}, Test suites: ${totalTestSuites}, CI workflows: ${totalCIWorkflows}.

Provide a concise, 2-3 sentence objective assessment summary. Highlight observed public evidence strengths and recommend high-value evidence additions.
CRITICAL RULES:
- Do NOT treat missing public evidence as proof of inability.
- Be encouraging, realistic, and objective.
- Return ONLY plain text without headers or bullet points.`;

    const aiSummary = await generateContent(aiPrompt);
    if (aiSummary && aiSummary.trim().length > 30) {
      summaryText = aiSummary.trim();
    }
  } catch {
    // Fall back safely to deterministic summary text
  }

  return {
    id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    targetRole: {
      name: matchedRole.name,
      description: matchedRole.description,
      category: matchedRole.category,
      coreSkillKeywords: matchedRole.coreSkillKeywords,
      relevantSkillKeywords: matchedRole.relevantSkillKeywords,
      evidenceFocus: matchedRole.evidenceFocus,
    },
    githubUsername,
    assessedAt: new Date().toISOString(),
    metrics: {
      totalClaimedSkills,
      provenSkillsCount,
      partialSkillsCount,
      claimedOnlySkillsCount,
      skillsWithPublicEvidence,
      skillsWithoutPublicEvidence,
      roleRelevantSkillsClaimed,
      roleRelevantSkillsWithEvidence,
      evidenceCoveragePercentage,
      totalInspectedRepos: topRepos.length,
      totalTestSuites,
      totalCIWorkflows,
      totalDeploymentConfigs,
      totalVerifiedCommits,
    },
    skills: assessedSkills,
    unclaimedRoleSkills: unclaimedRoleSkills.slice(0, 8),
    roleInsights: {
      observedStrengths,
      evidenceOpportunities,
      summary: summaryText,
    },
    notice:
      "This assessment classifies publicly accessible repository evidence into PROVEN, PARTIAL, and CLAIMED-ONLY tiers. The absence of public evidence does not imply a lack of competence; skills may be acquired through private repositories, academic coursework, or proprietary enterprise projects.",
  };
}
