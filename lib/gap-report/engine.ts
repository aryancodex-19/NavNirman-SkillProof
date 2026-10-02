import { isSkillMatch } from "@/lib/assessment/engine";

export type GapState =
  | "SUPPORTED"
  | "PARTIAL"
  | "CLAIMED_ONLY"
  | "NOT_EVIDENCED";

export interface Microtask {
  id: string;
  title: string;
  description: string;
  steps: string[];
  deliverable: string;
  validation: string;
  estimatedHours: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface GapItem {
  skill: string;
  state: GapState;
  importance: "REQUIRED" | "PREFERRED" | "NICE_TO_HAVE";
  evidenceCount: number;
  evidenceSummary: string;
  citationUrls: string[];
  microtask: Microtask;
}

export interface GapReport {
  id: string;
  jobTitle: string;
  jobCompany: string;
  generatedAt: string;
  targetRole: string;
  summary: {
    totalRequirements: number;
    supported: number;
    partial: number;
    claimedOnly: number;
    notEvidenced: number;
    readinessScore: number;
    readinessLabel: "Job-Ready" | "Nearly Ready" | "Needs Work" | "Significant Gaps";
  };
  gaps: GapItem[];
  strengths: string[];
  topPriorityActions: string[];
  notice: string;
}

const JD_SKILL_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /\breact(?:\.?js)?\b/i, canonical: "React" },
  { pattern: /\bvue(?:\.?js)?\b/i, canonical: "Vue.js" },
  { pattern: /\bangular\b/i, canonical: "Angular" },
  { pattern: /\bnext\.?js\b/i, canonical: "Next.js" },
  { pattern: /\bnode\.?js\b|\bnodejs\b/i, canonical: "Node.js" },
  { pattern: /\bexpress(?:\.?js)?\b/i, canonical: "Express.js" },
  { pattern: /\btypescript\b/i, canonical: "TypeScript" },
  { pattern: /\bjavascript\b/i, canonical: "JavaScript" },
  { pattern: /\bpython\b/i, canonical: "Python" },
  { pattern: /\bjava\b(?!script)/i, canonical: "Java" },
  { pattern: /\bc\+\+\b|\bcpp\b/i, canonical: "C++" },
  { pattern: /\bgo(?:lang)?\b/i, canonical: "Go" },
  { pattern: /\brust\b/i, canonical: "Rust" },
  { pattern: /\bruby\b/i, canonical: "Ruby" },
  { pattern: /\bphp\b/i, canonical: "PHP" },
  { pattern: /\bswift\b/i, canonical: "Swift" },
  { pattern: /\bkotlin\b/i, canonical: "Kotlin" },
  { pattern: /\bflutter\b/i, canonical: "Flutter" },
  { pattern: /\breact\s+native\b/i, canonical: "React Native" },
  { pattern: /\bpostgres(?:ql)?\b/i, canonical: "PostgreSQL" },
  { pattern: /\bmysql\b/i, canonical: "MySQL" },
  { pattern: /\bmongodb?\b/i, canonical: "MongoDB" },
  { pattern: /\bredis\b/i, canonical: "Redis" },
  { pattern: /\bsqlite\b/i, canonical: "SQLite" },
  { pattern: /\bprisma\b/i, canonical: "Prisma" },
  { pattern: /\bsupabase\b/i, canonical: "Supabase" },
  { pattern: /\bfirebase\b/i, canonical: "Firebase" },
  { pattern: /\bdocker\b/i, canonical: "Docker" },
  { pattern: /\bkubernetes\b|\bk8s\b/i, canonical: "Kubernetes" },
  { pattern: /\baws\b|\bamazon\s+web\s+services\b/i, canonical: "AWS" },
  { pattern: /\bgcp\b|\bgoogle\s+cloud\b/i, canonical: "GCP" },
  { pattern: /\bazure\b/i, canonical: "Azure" },
  { pattern: /\bci\s*\/?\s*cd\b|\bgithub\s+actions\b/i, canonical: "CI/CD" },
  { pattern: /\bgit\b/i, canonical: "Git" },
  { pattern: /\blinux\b/i, canonical: "Linux" },
  { pattern: /\bterraform\b/i, canonical: "Terraform" },
  { pattern: /\bgraphql\b/i, canonical: "GraphQL" },
  { pattern: /\brest\s*(?:ful)?\s*api\b|\brest\s+api\b/i, canonical: "REST API" },
  { pattern: /\bhtml5?\b/i, canonical: "HTML" },
  { pattern: /\bcss3?\b/i, canonical: "CSS" },
  { pattern: /\btailwind\b/i, canonical: "Tailwind CSS" },
  { pattern: /\bredux\b/i, canonical: "Redux" },
  { pattern: /\bmachine\s+learning\b/i, canonical: "Machine Learning" },
  { pattern: /\bdeep\s+learning\b/i, canonical: "Deep Learning" },
  { pattern: /\bai\s*\/\s*ml\b|\bartificial\s+intelligence\b/i, canonical: "AI/ML" },
  { pattern: /\btensorflow\b/i, canonical: "TensorFlow" },
  { pattern: /\bpytorch\b/i, canonical: "PyTorch" },
  { pattern: /\bpandas\b/i, canonical: "Pandas" },
  { pattern: /\bnumpy\b/i, canonical: "NumPy" },
  { pattern: /\bscikit[\s-]learn\b/i, canonical: "Scikit-Learn" },
  { pattern: /\boop\b|\bobject[\s-]oriented\b/i, canonical: "OOP" },
  { pattern: /\bdata\s+structures\b/i, canonical: "Data Structures" },
  { pattern: /\balgorithms?\b/i, canonical: "Algorithms" },
  { pattern: /\bsystem\s+design\b/i, canonical: "System Design" },
  { pattern: /\bmicroservices?\b/i, canonical: "Microservices" },
  { pattern: /\bfigma\b/i, canonical: "Figma" },
  { pattern: /\bvs\s*code\b|\bvisual\s+studio\s+code\b/i, canonical: "VS Code" },
  { pattern: /\bpostman\b/i, canonical: "Postman" },
  { pattern: /\bjest\b/i, canonical: "Jest" },
  { pattern: /\bpytest\b/i, canonical: "Pytest" },
  { pattern: /\bcypress\b/i, canonical: "Cypress" },
  { pattern: /\bunit\s+test|\btesting\b/i, canonical: "Testing" },
  { pattern: /\bnestjs\b|\bnest\.js\b/i, canonical: "NestJS" },
  { pattern: /\bdjango\b/i, canonical: "Django" },
  { pattern: /\bfastapi\b/i, canonical: "FastAPI" },
  { pattern: /\bflask\b/i, canonical: "Flask" },
  { pattern: /\bspring\s+boot\b/i, canonical: "Spring Boot" },
  { pattern: /\bdata\s+analysis\b/i, canonical: "Data Analysis" },
  { pattern: /\bsql\b/i, canonical: "SQL" },
];

export function extractRequirementsFromJD(jd: string): { required: string[]; preferred: string[] } {
  if (!jd || typeof jd !== "string") return { required: [], preferred: [] };
  const lines = jd.split(/\r?\n/);
  const requiredLines: string[] = [];
  const preferredLines: string[] = [];
  let currentSection: "required" | "preferred" | "unknown" = "unknown";
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/required|must\s+have|essential|mandatory|minimum|we\s+require|you\s+need|requirements/i.test(lower) && lower.length < 80) {
      currentSection = "required";
    } else if (/preferred|nice[\s-]to[\s-]have|bonus|plus|desired|advantageous|would\s+be\s+a/i.test(lower) && lower.length < 80) {
      currentSection = "preferred";
    }
    if (currentSection === "preferred") preferredLines.push(line);
    else requiredLines.push(line);
  }
  function extractFromText(text: string): string[] {
    const found = new Set<string>();
    for (const { pattern, canonical } of JD_SKILL_PATTERNS) {
      if (pattern.test(text)) found.add(canonical);
    }
    return Array.from(found);
  }
  const required = extractFromText(requiredLines.join("\n"));
  const preferred = extractFromText(preferredLines.join("\n")).filter((s) => !required.includes(s));
  return { required, preferred };
}

export function generateMicrotask(skill: string, state: GapState, importance: "REQUIRED" | "PREFERRED" | "NICE_TO_HAVE"): Microtask {
  const id = `mt_${skill.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
  const priorityMap: Record<GapState, Record<"REQUIRED" | "PREFERRED" | "NICE_TO_HAVE", "HIGH" | "MEDIUM" | "LOW">> = {
    NOT_EVIDENCED: { REQUIRED: "HIGH", PREFERRED: "HIGH", NICE_TO_HAVE: "MEDIUM" },
    CLAIMED_ONLY:  { REQUIRED: "HIGH", PREFERRED: "MEDIUM", NICE_TO_HAVE: "LOW" },
    PARTIAL:       { REQUIRED: "MEDIUM", PREFERRED: "MEDIUM", NICE_TO_HAVE: "LOW" },
    SUPPORTED:     { REQUIRED: "LOW", PREFERRED: "LOW", NICE_TO_HAVE: "LOW" },
  };
  const priority = priorityMap[state][importance];
  if (state === "SUPPORTED") return { id, title: `Maintain ${skill} evidence`, description: `Verified public evidence exists for ${skill}. Keep repositories active.`, steps: [`Review your public ${skill} repositories.`, `Ensure READMEs are up to date.`, `Pin the most relevant ${skill} repo on your GitHub profile.`], deliverable: `Well-documented public ${skill} repository`, validation: `Repository has a clear README and working code.`, estimatedHours: 2, priority };
  if (state === "PARTIAL") return { id, title: `Elevate ${skill} from PARTIAL to PROVEN`, description: `Preliminary evidence exists for ${skill} but needs more tests or code.`, steps: [`Open your existing ${skill} project.`, `Add at least 3 unit/integration tests.`, `Update the README to explain the ${skill} implementation.`, `Push changes with a clear commit message.`], deliverable: `Test suite with ≥3 tests in a public repo`, validation: `Tests pass and are visible on GitHub.`, estimatedHours: 4, priority };
  if (state === "CLAIMED_ONLY") return { id, title: `Publish public ${skill} evidence`, description: `${skill} is on your resume but no public GitHub evidence was found.`, steps: [`Create a public repo named "${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}-demo" or add to an existing project.`, `Build a small working feature using ${skill}.`, `Write a README with setup instructions.`, `Add at least 2 tests.`, `Push to GitHub and pin the repo.`], deliverable: `Public GitHub repo with working ${skill} code`, validation: `Repo is public, code runs, and has ≥2 passing tests.`, estimatedHours: 6, priority };
  return { id, title: `Learn and demonstrate ${skill}`, description: `${skill} is required for this role but is not on your resume or GitHub.`, steps: [`Complete a ${skill} tutorial (2–4 hours).`, `Build a minimal working project.`, `Create a public GitHub repo.`, `Write a README explaining what you built.`, `Add the skill to your resume.`], deliverable: `Public project using ${skill} with a README`, validation: `Project runs end-to-end and code is on GitHub.`, estimatedHours: 8, priority };
}

export function extractJobTitleFromJD(jd: string): { title: string; company: string } {
  const lines = jd.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let title = "Software Engineering Role";
  let company = "";
  for (const line of lines.slice(0, 8)) {
    if (!company && /\bat\s+\w|company|corp|inc\.|ltd\.|llc/i.test(line) && line.length < 100) company = line;
    if (title === "Software Engineering Role" && /(engineer|developer|architect|scientist|analyst|designer|manager|lead|intern)/i.test(line) && line.length < 100) title = line;
  }
  return { title, company };
}

export function computeGapReport(params: { jd: string; assessment: any; targetRole: string }): GapReport {
  const { jd, assessment, targetRole } = params;
  const { required, preferred } = extractRequirementsFromJD(jd);
  const { title: jobTitle, company: jobCompany } = extractJobTitleFromJD(jd);
  const assessedSkillsMap = new Map<string, any>();
  if (Array.isArray(assessment?.skills)) {
    for (const s of assessment.skills) assessedSkillsMap.set(s.skill.toLowerCase(), s);
  }
  function findAssessedSkill(skill: string): any | null {
    const lk = skill.toLowerCase();
    if (assessedSkillsMap.has(lk)) return assessedSkillsMap.get(lk);
    for (const [, assessed] of assessedSkillsMap) { if (isSkillMatch(skill, assessed.skill)) return assessed; }
    return null;
  }
  const gaps: GapItem[] = [];
  const strengths: string[] = [];
  function processSkill(skill: string, importance: "REQUIRED" | "PREFERRED" | "NICE_TO_HAVE") {
    const assessed = findAssessedSkill(skill);
    let state: GapState;
    let evidenceCount = 0;
    let evidenceSummary = "";
    const citationUrls: string[] = [];
    if (assessed) {
      const cls = assessed.classification as string;
      if (cls === "PROVEN") {
        state = "SUPPORTED"; evidenceCount = assessed.evidenceCount ?? assessed.citations?.length ?? 0;
        evidenceSummary = assessed.explanation || `Verified through ${evidenceCount} public artifact(s).`;
        citationUrls.push(...(assessed.citations || []).filter((c: any) => c.repoUrl).map((c: any) => c.fileUrl || c.repoUrl).slice(0, 3));
      } else if (cls === "PARTIAL") {
        state = "PARTIAL"; evidenceCount = assessed.evidenceCount ?? assessed.citations?.length ?? 0;
        evidenceSummary = assessed.explanation || `Preliminary evidence found (${evidenceCount} artifact(s)).`;
        citationUrls.push(...(assessed.citations || []).filter((c: any) => c.repoUrl).map((c: any) => c.fileUrl || c.repoUrl).slice(0, 2));
      } else {
        state = "CLAIMED_ONLY"; evidenceSummary = `${skill} is listed on your resume but no public repository evidence was found.`;
      }
    } else {
      state = "NOT_EVIDENCED"; evidenceSummary = `${skill} was not found on your resume or in your public GitHub repositories.`;
    }
    if (state === "SUPPORTED" && importance !== "NICE_TO_HAVE") strengths.push(`${skill}: ${evidenceSummary}`);
    gaps.push({ skill, state, importance, evidenceCount, evidenceSummary, citationUrls, microtask: generateMicrotask(skill, state, importance) });
  }
  const seen = new Set<string>();
  const addSkill = (skill: string, importance: "REQUIRED" | "PREFERRED" | "NICE_TO_HAVE") => { const key = skill.toLowerCase(); if (!seen.has(key)) { seen.add(key); processSkill(skill, importance); } };
  for (const s of required) addSkill(s, "REQUIRED");
  for (const s of preferred) addSkill(s, "PREFERRED");
  if (Array.isArray(assessment?.unclaimedRoleSkills)) { for (const s of assessment.unclaimedRoleSkills.slice(0, 5)) addSkill(s, "NICE_TO_HAVE"); }
  if (gaps.length === 0) return { id: `gr_${Date.now()}`, jobTitle, jobCompany, generatedAt: new Date().toISOString(), targetRole, summary: { totalRequirements: 0, supported: 0, partial: 0, claimedOnly: 0, notEvidenced: 0, readinessScore: 0, readinessLabel: "Needs Work" }, gaps: [], strengths: [], topPriorityActions: ["No recognizable technical skills could be extracted from the job description. Try pasting a more detailed JD."], notice: "Gap analysis requires a detailed job description." };
  const supported = gaps.filter((g) => g.state === "SUPPORTED").length;
  const partial = gaps.filter((g) => g.state === "PARTIAL").length;
  const claimedOnly = gaps.filter((g) => g.state === "CLAIMED_ONLY").length;
  const notEvidenced = gaps.filter((g) => g.state === "NOT_EVIDENCED").length;
  let weightedScore = 0, weightedMax = 0;
  for (const g of gaps) {
    const w = g.importance === "REQUIRED" ? 3 : g.importance === "PREFERRED" ? 2 : 1;
    const pts = g.state === "SUPPORTED" ? 100 : g.state === "PARTIAL" ? 50 : g.state === "CLAIMED_ONLY" ? 20 : 0;
    weightedScore += pts * w; weightedMax += 100 * w;
  }
  const readinessScore = weightedMax > 0 ? Math.round((weightedScore / weightedMax) * 100) : 0;
  const readinessLabel = readinessScore >= 80 ? "Job-Ready" : readinessScore >= 60 ? "Nearly Ready" : readinessScore >= 35 ? "Needs Work" : "Significant Gaps";
  const topPriorityActions = gaps.filter((g) => g.microtask.priority === "HIGH" || g.microtask.priority === "MEDIUM").sort((a, b) => (a.importance === "REQUIRED" ? 0 : 1) - (b.importance === "REQUIRED" ? 0 : 1)).slice(0, 5).map((g) => g.microtask.title);
  return { id: `gr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, jobTitle, jobCompany, generatedAt: new Date().toISOString(), targetRole, summary: { totalRequirements: gaps.length, supported, partial, claimedOnly, notEvidenced, readinessScore, readinessLabel }, gaps, strengths: strengths.slice(0, 6), topPriorityActions, notice: "This gap report is based on skills detectable in your job description and your existing Evidence-Based Assessment. Run your assessment first for the most accurate results." };
}
