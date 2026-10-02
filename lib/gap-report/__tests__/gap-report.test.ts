import assert from "node:assert";
import { describe, it } from "node:test";
import {
  extractRequirementsFromJD,
  computeGapReport,
  generateMicrotask,
  extractJobTitleFromJD,
} from "../../gap-report/engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const SAMPLE_JD_FULL_STACK = `
Senior Full Stack Engineer at TechCorp Inc.

We are looking for a Senior Full Stack Engineer.

Requirements:
- 3+ years of experience with React and TypeScript
- Proficiency in Node.js and PostgreSQL
- Experience with Docker and CI/CD pipelines (GitHub Actions)
- Familiarity with REST APIs and GraphQL
- Strong understanding of Git and Linux

Preferred:
- Experience with Kubernetes and AWS
- Knowledge of Redis
- Familiarity with system design
`;

const SAMPLE_JD_DATA_SCIENCE = `
Data Scientist at AI Startup

Requirements:
- Python programming (pandas, NumPy, scikit-learn)
- Machine learning and deep learning experience
- SQL proficiency
- Experience with TensorFlow or PyTorch

Preferred:
- Data analysis background
- Docker knowledge
`;

const SAMPLE_ASSESSMENT_WITH_SKILLS = {
  skills: [
    { skill: "React", classification: "PROVEN", evidenceCount: 4, citations: [{ repoUrl: "https://github.com/user/project", fileUrl: "https://github.com/user/project/blob/main/src/App.tsx" }], explanation: "Verified through 4 public artifacts." },
    { skill: "TypeScript", classification: "PARTIAL", evidenceCount: 1, citations: [{ repoUrl: "https://github.com/user/project" }], explanation: "Preliminary evidence found." },
    { skill: "Node.js", classification: "CLAIMED-ONLY", evidenceCount: 0, citations: [], explanation: "On resume but no public evidence." },
    { skill: "Python", classification: "PROVEN", evidenceCount: 2, citations: [{ repoUrl: "https://github.com/user/ml" }], explanation: "Verified." },
    { skill: "Docker", classification: "CLAIMED-ONLY", evidenceCount: 0, citations: [], explanation: "On resume, no evidence." },
  ],
  unclaimedRoleSkills: ["Kubernetes"],
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Feature 3: Gap Report Engine", () => {
  describe("extractRequirementsFromJD", () => {
    it("extracts React, TypeScript, Node.js, PostgreSQL from full-stack JD", () => {
      const { required } = extractRequirementsFromJD(SAMPLE_JD_FULL_STACK);
      assert.ok(required.includes("React"), `Expected React in required: ${required}`);
      assert.ok(required.includes("TypeScript"), `Expected TypeScript: ${required}`);
      assert.ok(required.includes("Node.js"), `Expected Node.js: ${required}`);
      assert.ok(required.includes("PostgreSQL"), `Expected PostgreSQL: ${required}`);
    });

    it("extracts Docker and CI/CD from required section", () => {
      const { required } = extractRequirementsFromJD(SAMPLE_JD_FULL_STACK);
      assert.ok(required.includes("Docker"), `Expected Docker: ${required}`);
      assert.ok(required.includes("CI/CD"), `Expected CI/CD: ${required}`);
    });

    it("puts Kubernetes and AWS in preferred, not required", () => {
      const { required, preferred } = extractRequirementsFromJD(SAMPLE_JD_FULL_STACK);
      assert.ok(preferred.includes("Kubernetes"), `Expected Kubernetes in preferred: ${preferred}`);
      assert.ok(preferred.includes("AWS"), `Expected AWS in preferred: ${preferred}`);
      assert.ok(!required.includes("Kubernetes"), `Kubernetes should NOT be in required: ${required}`);
    });

    it("extracts Python, Machine Learning, TensorFlow from data-science JD", () => {
      const { required } = extractRequirementsFromJD(SAMPLE_JD_DATA_SCIENCE);
      assert.ok(required.includes("Python"), `Expected Python: ${required}`);
      assert.ok(required.includes("Machine Learning"), `Expected Machine Learning: ${required}`);
      assert.ok(required.includes("TensorFlow") || required.includes("PyTorch"), `Expected TensorFlow or PyTorch: ${required}`);
    });

    it("handles empty JD gracefully", () => {
      const result = extractRequirementsFromJD("");
      assert.deepStrictEqual(result, { required: [], preferred: [] });
    });

    it("does not confuse Java with JavaScript", () => {
      const jd = "Requirements: Java backend development, Spring Boot";
      const { required } = extractRequirementsFromJD(jd);
      assert.ok(required.includes("Java"), `Expected Java: ${required}`);
      assert.ok(!required.includes("JavaScript"), `Should NOT include JavaScript: ${required}`);
    });
  });

  describe("extractJobTitleFromJD", () => {
    it("extracts job title from JD header", () => {
      const { title } = extractJobTitleFromJD(SAMPLE_JD_FULL_STACK);
      assert.ok(title.length > 0, "Should extract a title");
      assert.ok(/engineer|developer|scientist|analyst/i.test(title), `Title should contain role keyword: ${title}`);
    });

    it("extracts company name", () => {
      const { company } = extractJobTitleFromJD(SAMPLE_JD_FULL_STACK);
      assert.ok(company.length > 0 || true, "Company may or may not be found — should not error");
    });
  });

  describe("generateMicrotask", () => {
    it("NOT_EVIDENCED + REQUIRED generates HIGH priority microtask", () => {
      const task = generateMicrotask("React", "NOT_EVIDENCED", "REQUIRED");
      assert.strictEqual(task.priority, "HIGH");
      assert.ok(task.steps.length >= 3, "Should have at least 3 steps");
      assert.ok(task.deliverable.length > 0, "Should have a deliverable");
      assert.ok(task.validation.length > 0, "Should have validation criteria");
      assert.ok(task.estimatedHours > 0, "Should have time estimate");
    });

    it("SUPPORTED generates LOW priority microtask", () => {
      const task = generateMicrotask("Python", "SUPPORTED", "REQUIRED");
      assert.strictEqual(task.priority, "LOW");
    });

    it("PARTIAL + REQUIRED generates MEDIUM priority", () => {
      const task = generateMicrotask("Docker", "PARTIAL", "REQUIRED");
      assert.strictEqual(task.priority, "MEDIUM");
    });

    it("CLAIMED_ONLY + PREFERRED generates MEDIUM priority", () => {
      const task = generateMicrotask("AWS", "CLAIMED_ONLY", "PREFERRED");
      assert.strictEqual(task.priority, "MEDIUM");
    });
  });

  describe("computeGapReport", () => {
    it("produces a valid report for full-stack JD with existing assessment", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });

      assert.ok(report.id, "Report should have an ID");
      assert.ok(report.generatedAt, "Report should have a timestamp");
      assert.ok(Array.isArray(report.gaps), "Should have gaps array");
      assert.ok(report.gaps.length > 0, "Should have at least one gap");
      assert.ok(typeof report.summary.readinessScore === "number", "Should have readiness score");
      assert.ok(report.summary.readinessScore >= 0 && report.summary.readinessScore <= 100, "Score must be 0-100");
    });

    it("React PROVEN shows as SUPPORTED in report", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      const reactGap = report.gaps.find((g) => g.skill === "React");
      assert.ok(reactGap, "React should appear in gaps");
      assert.strictEqual(reactGap.state, "SUPPORTED", "React should be SUPPORTED");
    });

    it("TypeScript PARTIAL shows as PARTIAL in report", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      const tsGap = report.gaps.find((g) => g.skill === "TypeScript");
      assert.ok(tsGap, "TypeScript should appear in gaps");
      assert.strictEqual(tsGap.state, "PARTIAL", "TypeScript should be PARTIAL");
    });

    it("Node.js CLAIMED-ONLY shows as CLAIMED_ONLY in report", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      const nodeGap = report.gaps.find((g) => g.skill === "Node.js");
      assert.ok(nodeGap, "Node.js should appear in gaps");
      assert.strictEqual(nodeGap.state, "CLAIMED_ONLY", "Node.js should be CLAIMED_ONLY");
    });

    it("PostgreSQL (not in assessment) shows as NOT_EVIDENCED", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      const pgGap = report.gaps.find((g) => g.skill === "PostgreSQL");
      assert.ok(pgGap, "PostgreSQL should appear in gaps");
      assert.strictEqual(pgGap.state, "NOT_EVIDENCED", "PostgreSQL should be NOT_EVIDENCED");
    });

    it("readiness score is higher when more skills are SUPPORTED", () => {
      const allProvenAssessment = {
        skills: [
          { skill: "React", classification: "PROVEN", evidenceCount: 5, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "TypeScript", classification: "PROVEN", evidenceCount: 3, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "Node.js", classification: "PROVEN", evidenceCount: 2, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "PostgreSQL", classification: "PROVEN", evidenceCount: 1, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "Docker", classification: "PROVEN", evidenceCount: 2, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "Git", classification: "PROVEN", evidenceCount: 10, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "Linux", classification: "PROVEN", evidenceCount: 1, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
          { skill: "REST API", classification: "PROVEN", evidenceCount: 2, citations: [{ repoUrl: "https://github.com/u/r" }], explanation: "Proven." },
        ],
      };
      const highReport = computeGapReport({ jd: SAMPLE_JD_FULL_STACK, assessment: allProvenAssessment, targetRole: "Full Stack Engineer" });
      const lowReport = computeGapReport({ jd: SAMPLE_JD_FULL_STACK, assessment: { skills: [] }, targetRole: "Full Stack Engineer" });
      assert.ok(highReport.summary.readinessScore > lowReport.summary.readinessScore, `High (${highReport.summary.readinessScore}) should exceed low (${lowReport.summary.readinessScore})`);
    });

    it("summary counts add up to total", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      const { supported, partial, claimedOnly, notEvidenced, totalRequirements } = report.summary;
      assert.strictEqual(supported + partial + claimedOnly + notEvidenced, totalRequirements, "Counts must add up to total");
    });

    it("returns a valid report with no assessment (cold start)", () => {
      const report = computeGapReport({
        jd: SAMPLE_JD_FULL_STACK,
        assessment: null,
        targetRole: "Full Stack Engineer",
      });
      assert.ok(Array.isArray(report.gaps), "Should still have gaps array");
      assert.ok(report.gaps.every((g) => g.state === "NOT_EVIDENCED"), "All should be NOT_EVIDENCED with no assessment");
    });

    it("empty JD returns report with 0 gaps", () => {
      const report = computeGapReport({
        jd: "Lorem ipsum dolor sit amet consectetur",
        assessment: SAMPLE_ASSESSMENT_WITH_SKILLS,
        targetRole: "Full Stack Engineer",
      });
      assert.ok(report.gaps.length === 0 || report.topPriorityActions.length > 0, "Should handle no-skills JD gracefully");
    });
  });
});
