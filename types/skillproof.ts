export type SkillVerdict = "PROVEN" | "PARTIAL" | "CLAIMED_ONLY";
export type EvidenceStrength = "WEAK" | "PARTIAL" | "STRONG";

export interface EvidenceLink {
  label: string;
  url: string;
}

export interface GitHubRepoEvidence {
  name: string;
  url: string;
  language?: string | null;
  updatedAt?: string | null;
  readmeUrl?: string | null;
  commitsUrl?: string;
  languages: string[];
  reasons: string[];
  testsDetected: boolean;
  recentActivity: boolean;
  deploymentEvidence: boolean;
}

export interface SkillClaim {
  skill: string;
  claimedLevel?: string;
  source: "resume" | "job" | "manual";
  verdict: SkillVerdict;
  evidenceStrength: EvidenceStrength;
  evidenceSummary: string[];
  evidenceLinks: EvidenceLink[];
  whatItSupports: string;
  whatItDoesNotProve: string;
  repositoryCount: number;
  repositoryEvidence: GitHubRepoEvidence[];
}

export interface SkillGap {
  skill: string;
  required: boolean;
  verdict: SkillVerdict;
  evidenceStrength: EvidenceStrength;
  evidenceLinks: EvidenceLink[];
  microtask: string;
  estimatedTime: string;
  expectedEvidence: string[];
}

export interface JobRequirementReport {
  matchScore: number;
  requiredSkills: string[];
  supportedSkills: string[];
  insufficientEvidence: string[];
  missingRequirements: string[];
  skillGaps: SkillGap[];
}

export interface SkillProofAnalysis {
  githubProfile: {
    login: string;
    name?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    htmlUrl: string;
    publicRepos: number;
    followers: number;
    following: number;
    createdAt?: string | null;
  };
  claimedSkills: string[];
  skills: SkillClaim[];
  overallCoverage: number;
  jobReport?: JobRequirementReport;
  generatedAt: string;
}
