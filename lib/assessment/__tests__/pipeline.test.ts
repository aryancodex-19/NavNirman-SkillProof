import assert from "node:assert";
import zlib from "node:zlib";
import {
  extractTextFromPdfBuffer,
  extractSkillsFromText,
} from "../../ai/gemini";
import { normalizeExtractedSkills } from "../../../app/api/resume/parse/route";
import {
  isSkillMatch,
  calculateRoleRelevance,
  classifySkillEvidence,
  runSkillEvidenceAssessment,
  EvidenceCitation,
} from "../engine";
import { TARGET_ROLES } from "../roles";

/**
 * Helper to generate a minimal valid PDF buffer containing a text stream.
 * Uses FlateDecode compression to simulate real-world PDF resume exports.
 */
function createSyntheticPdfBuffer(textContent: string, compress = true): Buffer {
  const streamBody = `BT /F1 12 Tf 50 750 Td (${textContent.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  let streamData: Buffer;
  let filterString = "";

  if (compress) {
    streamData = zlib.deflateSync(Buffer.from(streamBody, "utf-8"));
    filterString = "/Filter /FlateDecode ";
  } else {
    streamData = Buffer.from(streamBody, "utf-8");
  }

  const pdfTemplate = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< ${filterString}/Length ${streamData.length} >>
stream
`;
  const header = Buffer.from(pdfTemplate, "utf-8");
  const footer = Buffer.from(
    "\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \ntrailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n500\n%%EOF",
    "utf-8"
  );

  return Buffer.concat([header, streamData, footer]);
}

async function runMasterTestSuite() {
  console.log("================================================================");
  console.log(" SkillProof Master Test Suite — Feature 1 Fix & Feature 2 Rules ");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function runCase(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`✔ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✖ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function runAsyncCase(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✔ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✖ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PART A: FEATURE 1 REGRESSION TESTS
  // ─────────────────────────────────────────────────────────────

  runCase("1. Text-based resume extraction (React, JS, TS, Node.js, SQL, Python, AWS, Git)", () => {
    const resumeText =
      "Senior Engineer with expertise in React, JavaScript, TypeScript, Node.js, SQL, Python, AWS, and Git.";
    const pdfBuffer = createSyntheticPdfBuffer(resumeText, true);

    const extractedText = extractTextFromPdfBuffer(pdfBuffer);
    assert(extractedText.length > 0, "Decompressed text should not be empty");
    assert(extractedText.includes("React"), "Extracted text must contain React");

    const skills = normalizeExtractedSkills(null, { summary: resumeText }, extractedText);
    const expected = ["React", "JavaScript", "TypeScript", "Node.js", "SQL", "Python", "AWS", "Git"];

    for (const exp of expected) {
      const found = skills.some((s) => s.toLowerCase() === exp.toLowerCase() || isSkillMatch(s, exp));
      assert(found, `Expected skill "${exp}" to be extracted, got: ${JSON.stringify(skills)}`);
    }
  });

  runCase("2. Punctuation, capitalization, and alias normalization", () => {
    const testCases: [string, string, boolean][] = [
      ["react.js", "react", true],
      ["REACTJS", "react", true],
      ["node-js", "node.js", true],
      ["NODEJS", "node.js", true],
      ["Type_Script", "typescript", true],
      ["TYPESCRIPT", "ts", true],
      ["c++", "c++", true],
      ["cpp", "c++", true],
      ["C#", "csharp", true],
      ["CI/CD", "cicd", true],
      ["ci/cd", "continuous integration", true],
      ["AWS", "amazon web services", true],
      ["PostgreSQL", "sql", true],
      [".NET", "dotnet", true],
      ["tailwind-css", "tailwind css", true],
      ["k8s", "kubernetes", true],
    ];

    for (const [candidate, target, expectedMatch] of testCases) {
      const match = isSkillMatch(candidate, target);
      assert.strictEqual(
        match,
        expectedMatch,
        `Expected isSkillMatch("${candidate}", "${target}") to be ${expectedMatch}`
      );
    }
  });

  runCase("3. Strict distinction: Java vs JavaScript", () => {
    // isSkillMatch must never confuse Java with JavaScript
    assert.strictEqual(isSkillMatch("Java", "JavaScript"), false, "Java must not match JavaScript");
    assert.strictEqual(isSkillMatch("JavaScript", "Java"), false, "JavaScript must not match Java");

    // extractSkillsFromText on a resume mentioning only Java must not extract JavaScript
    const textJavaOnly = "Backend Developer specializing in Java 17, Spring Boot, and PostgreSQL.";
    const skillsJava = extractSkillsFromText(textJavaOnly);
    assert(skillsJava.includes("Java"), "Must extract Java");
    assert(!skillsJava.includes("JavaScript"), "Must NOT extract JavaScript from Java-only text");

    // extractSkillsFromText on a resume mentioning only JavaScript must not extract Java
    const textJsOnly = "Frontend Developer specializing in JavaScript, React, and CSS.";
    const skillsJs = extractSkillsFromText(textJsOnly);
    assert(skillsJs.includes("JavaScript"), "Must extract JavaScript");
    assert(!skillsJs.includes("Java"), "Must NOT extract Java from JavaScript-only text");
  });

  runCase("4. Strict distinction: C vs C++ vs C#", () => {
    assert.strictEqual(isSkillMatch("C", "C++"), false, "C must not match C++");
    assert.strictEqual(isSkillMatch("C++", "C"), false, "C++ must not match C");
    assert.strictEqual(isSkillMatch("C", "C#"), false, "C must not match C#");
    assert.strictEqual(isSkillMatch("C#", "C"), false, "C# must not match C");
    assert.strictEqual(isSkillMatch("C++", "C#"), false, "C++ must not match C#");

    // C++ extraction
    const cppText = "Low-latency systems development in C++ and Python.";
    const cppSkills = extractSkillsFromText(cppText);
    assert(cppSkills.includes("C++"), "Must extract C++");
    assert(!cppSkills.includes("C"), "Must NOT extract plain C from C++ text");
    assert(!cppSkills.includes("C#"), "Must NOT extract C# from C++ text");
  });

  runCase("5. Single 'R' character false positive prevention", () => {
    // An arbitrary text containing the letter R (registered mark, bullet point, initial)
    const textWithRandomR =
      "Utkarsh Pandey (R) - Project Manager. Managed team of 15 members. Section R: Overview.";
    const skills = extractSkillsFromText(textWithRandomR);
    assert(!skills.includes("R"), "Must NOT detect 'R' skill from arbitrary single letter R");

    // Explicit R language context
    const textWithRealR =
      "Data Scientist with expertise in R programming, RStudio, and Python.";
    const realSkills = extractSkillsFromText(textWithRealR);
    assert(realSkills.includes("R"), "Must detect R when explicitly written as R programming");
  });

  runCase("6. Non-technical resume returns 0 skills safely", () => {
    const nonTechText =
      "Experienced retail store manager with skills in customer service, sales leadership, inventory tracking, team scheduling, and budget reconciliation.";
    const skills = normalizeExtractedSkills([], { summary: nonTechText, experience: [] }, nonTechText);
    assert.strictEqual(skills.length, 0, "Non-technical resume must produce 0 skills without hallucinations");
  });

  runCase("7. Unreadable, empty, and scanned PDFs handle gracefully", () => {
    // 0-byte PDF
    const emptyBuffer = Buffer.alloc(0);
    const emptyText = extractTextFromPdfBuffer(emptyBuffer);
    assert.strictEqual(emptyText, "", "0-byte buffer should produce empty text");

    // Scanned image PDF without text stream operators
    const scannedImagePdf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /XObject /Subtype /Image /Width 100 /Height 100 >>\nstream\n\x00\x01\x02\x03\xff\xfe\nendstream\nendobj\n%%EOF"
    );
    const scannedText = extractTextFromPdfBuffer(scannedImagePdf);
    assert.strictEqual(scannedText.trim(), "", "Scanned image PDF must return empty text");
  });

  runCase("8. AI output formats normalization (objects, arrays, comma-separated)", () => {
    // Categorized object
    const categorized = {
      languages: ["TypeScript", "Python"],
      frameworks: ["React", "FastAPI"],
      tools: "Docker, Git, AWS",
    };
    const norm1 = normalizeExtractedSkills(categorized);
    assert(norm1.includes("TypeScript") && norm1.includes("Docker") && norm1.includes("FastAPI"));

    // Comma-separated string
    const commaSeparated = "Node.js, PostgreSQL, Redis, Tailwind CSS";
    const norm2 = normalizeExtractedSkills(commaSeparated);
    assert(norm2.includes("Node.js") && norm2.includes("PostgreSQL") && norm2.includes("Tailwind CSS"));
  });

  // ─────────────────────────────────────────────────────────────
  // PART B: FEATURE 2 EVIDENCE CLASSIFICATION TESTS
  // ─────────────────────────────────────────────────────────────

  runCase("9. Feature 2: PROVEN classification for substantial code & tests", () => {
    const citations: EvidenceCitation[] = [
      {
        type: "language",
        title: "TypeScript (80% of scanned code)",
        repoName: "web-app",
        repoUrl: "https://github.com/testuser/web-app",
        description: "Primary language with 45,000 bytes.",
      },
      {
        type: "test_suite",
        title: "Test suite: app.test.tsx",
        repoName: "web-app",
        repoUrl: "https://github.com/testuser/web-app",
        filePath: "app.test.tsx",
        description: "Automated test suite (Jest).",
      },
    ];

    const result = classifySkillEvidence({
      skill: "TypeScript",
      citations,
      languagesList: [{ name: "TypeScript", bytes: 45000, percentage: 80 }],
    });

    assert.strictEqual(result.classification, "PROVEN", "Must classify substantial code + test as PROVEN");
    assert(result.explanation.includes("PROVEN") || result.explanation.includes("Verified through"));
  });

  runCase("10. Feature 2: PARTIAL classification for weak metadata/manifest only", () => {
    const citations: EvidenceCitation[] = [
      {
        type: "package_manifest",
        title: "package.json (npm)",
        repoName: "sample-repo",
        repoUrl: "https://github.com/testuser/sample-repo",
        filePath: "package.json",
        description: "Declared in package.json.",
      },
    ];

    const result = classifySkillEvidence({
      skill: "Redis",
      citations,
      languagesList: [],
    });

    assert.strictEqual(result.classification, "PARTIAL", "Manifest without implementation must be PARTIAL");
    assert(result.nextStep.length > 10, "Must provide actionable next step recommendation");
  });

  runCase("11. Feature 2: CLAIMED-ONLY classification when no public evidence exists", () => {
    const result = classifySkillEvidence({
      skill: "Kubernetes",
      citations: [],
      languagesList: [],
    });

    assert.strictEqual(result.classification, "CLAIMED-ONLY", "0 citations must be CLAIMED-ONLY");
    assert(result.explanation.includes("no public repository"), "Must state missing public evidence");
    assert(result.nextStep.includes("Kubernetes"), "Next step must be skill-specific");
  });

  runCase("12. Feature 2: Role relevance calculation independent of evidence", () => {
    const frontendRole = TARGET_ROLES.find((r) => r.id === "frontend-engineer")!;

    // Core skill
    assert.strictEqual(calculateRoleRelevance("React", frontendRole), "CORE");
    assert.strictEqual(calculateRoleRelevance("TypeScript", frontendRole), "CORE");

    // Relevant supportive skill
    assert.strictEqual(calculateRoleRelevance("Git", frontendRole), "RELEVANT");
    assert.strictEqual(calculateRoleRelevance("Jest", frontendRole), "RELEVANT");

    // Not required skill
    assert.strictEqual(calculateRoleRelevance("Kubernetes", frontendRole), "NOT_REQUIRED");
    assert.strictEqual(calculateRoleRelevance("PyTorch", frontendRole), "NOT_REQUIRED");
  });

  await runAsyncCase("13. Feature 2: Complete Assessment pipeline with precedence & isolation", async () => {
    const uploadedResumeSkills = ["React", "TypeScript", "Node.js", "Docker", "Rust"];

    const mockGitHubData = {
      languages: {
        languages: [
          { name: "TypeScript", percentage: 70, bytes: 35000 },
          { name: "JavaScript", percentage: 30, bytes: 15000 },
        ],
      },
      projects: {
        topRepos: [
          {
            name: "frontend-app",
            url: "https://github.com/candidate/frontend-app",
            language: "TypeScript",
            topics: ["react", "frontend"],
            evidence: {
              tests: [{ name: "App.test.tsx", path: "src/App.test.tsx", framework: "Jest" }],
              ciWorkflows: [{ name: "ci.yml", path: ".github/workflows/ci.yml" }],
              deploymentConfigs: [{ name: "Dockerfile", path: "Dockerfile", type: "docker" }],
              recentCommits: [{ shortSha: "9f3a1b", message: "feat: add React dashboard" }],
              packageManifests: [{ name: "package.json", ecosystem: "npm", path: "package.json" }],
            },
          },
        ],
      },
    };

    const assessment = await runSkillEvidenceAssessment({
      resumeSkills: uploadedResumeSkills,
      githubData: mockGitHubData,
      targetRoleName: "Frontend Engineer",
      githubUsername: "candidate",
    });

    // 1. Skill list must match uploaded resume
    assert.strictEqual(assessment.skills.length, 5);
    const reactEval = assessment.skills.find((s) => s.skill === "React")!;
    assert.strictEqual(reactEval.classification, "PROVEN", "React should be PROVEN via commit + test + topic");
    assert.strictEqual(reactEval.roleRelevance, "CORE", "React should be CORE for Frontend Engineer");

    const tsEval = assessment.skills.find((s) => s.skill === "TypeScript")!;
    assert.strictEqual(tsEval.classification, "PROVEN", "TypeScript should be PROVEN via substantial language");

    const dockerEval = assessment.skills.find((s) => s.skill === "Docker")!;
    assert.strictEqual(dockerEval.classification, "PROVEN", "Docker should be PROVEN via Dockerfile config");
    assert.strictEqual(dockerEval.roleRelevance, "RELEVANT", "Docker should be RELEVANT for Frontend Engineer");

    const rustEval = assessment.skills.find((s) => s.skill === "Rust")!;
    assert.strictEqual(rustEval.classification, "CLAIMED-ONLY", "Rust should be CLAIMED-ONLY (no evidence)");

    // 2. Metrics check
    assert(assessment.metrics.provenSkillsCount >= 3, "Proven skills count must be >= 3");
    assert(assessment.metrics.claimedOnlySkillsCount >= 1, "Claimed only count must be >= 1");
    assert(assessment.metrics.evidenceCoveragePercentage > 0, "Evidence coverage must be > 0");
  });

  console.log("\n================================================================");
  console.log(` Summary: ${passed} passed, ${failed} failed.`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterTestSuite().catch((e) => {
  console.error(e);
  process.exit(1);
});
