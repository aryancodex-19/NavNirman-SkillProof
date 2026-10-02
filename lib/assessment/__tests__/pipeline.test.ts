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
 * Supports Tj strings, TJ arrays with kerning, and FlateDecode compression.
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

/**
 * Creates a synthetic PDF with TJ kerning arrays (simulating word splits like [(J) -20 (ava)] TJ)
 */
function createKernedPdfBuffer(tjArrayContent: string, compress = true): Buffer {
  const streamBody = `BT /F1 12 Tf 50 750 Td [${tjArrayContent}] TJ ET`;
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
  console.log(" SkillProof Master Test Suite — 16 Comprehensive Regression Tests");
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
  // 1. Multiple programming languages in one resume
  // ─────────────────────────────────────────────────────────────
  runCase("1. Multiple programming languages in one resume (Java, Python, Go, Rust, Kotlin, TypeScript)", () => {
    const resumeText =
      "Full stack polyglot developer proficient in Java, Python, Go, Rust, Kotlin, TypeScript, and SQL.";
    const pdfBuffer = createSyntheticPdfBuffer(resumeText, true);
    const extractedText = extractTextFromPdfBuffer(pdfBuffer);
    const skills = normalizeExtractedSkills(null, { summary: resumeText }, extractedText);

    const expected = ["Java", "Python", "Go", "Rust", "Kotlin", "TypeScript", "SQL"];
    for (const exp of expected) {
      assert(skills.includes(exp), `Expected skill "${exp}" to be extracted, got: ${JSON.stringify(skills)}`);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Skills split across lines and columns with PDF kerning
  // ─────────────────────────────────────────────────────────────
  runCase("2. Skills split across lines and kerning (TJ arrays: [(J) -20 (ava) -300 (P) -10 (ython)])", () => {
    // Kerned TJ stream where intra-word letters are split across kerning tokens
    const tjContent = `(J) -10 (ava) -300 (P) -10 (ython) -300 (O) -5 (OP) -300 (V) (S) -300 (Code) -300 (F) -5 (igma)`;
    const pdfBuffer = createKernedPdfBuffer(tjContent, true);
    const extractedText = extractTextFromPdfBuffer(pdfBuffer);

    assert(extractedText.includes("Java"), `Extracted text should reassemble "Java", got: "${extractedText}"`);
    assert(extractedText.includes("Python"), `Extracted text should reassemble "Python", got: "${extractedText}"`);
    assert(extractedText.includes("OOP"), `Extracted text should reassemble "OOP", got: "${extractedText}"`);
    assert(extractedText.includes("Figma"), `Extracted text should reassemble "Figma", got: "${extractedText}"`);

    const skills = normalizeExtractedSkills(null, {}, extractedText);
    assert(skills.includes("Java"), "Must extract Java from kerned stream");
    assert(skills.includes("Python"), "Must extract Python from kerned stream");
    assert(skills.includes("OOP"), "Must extract OOP from kerned stream");
    assert(skills.includes("Figma"), "Must extract Figma from kerned stream");
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Uppercase, lowercase, and mixed-case skill names
  // ─────────────────────────────────────────────────────────────
  runCase("3. Case-insensitive skill normalization (REACT, typeScript, Docker, pYtHoN)", () => {
    const rawSkills = ["REACT", "typeScript", "Docker", "pYtHoN", "kUbErNeTeS"];
    const normalized = normalizeExtractedSkills(rawSkills);

    assert(normalized.includes("React"), "Must canonicalize REACT -> React");
    assert(normalized.includes("TypeScript"), "Must canonicalize typeScript -> TypeScript");
    assert(normalized.includes("Docker"), "Must canonicalize Docker -> Docker");
    assert(normalized.includes("Python"), "Must canonicalize pYtHoN -> Python");
    assert(normalized.includes("Kubernetes"), "Must canonicalize kUbErNeTeS -> Kubernetes");
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Common aliases and punctuation-sensitive names
  // ─────────────────────────────────────────────────────────────
  runCase("4. Punctuation-sensitive aliases (.NET, Node.js, Next.js, C++, C#, Tailwind CSS, REST API)", () => {
    const aliasesInput = ["dotnet", "nodejs", "nextjs", "cpp", "csharp", "tailwindcss", "restful api"];
    const normalized = normalizeExtractedSkills(aliasesInput);

    assert(normalized.includes(".NET"), "dotnet -> .NET");
    assert(normalized.includes("Node.js"), "nodejs -> Node.js");
    assert(normalized.includes("Next.js"), "nextjs -> Next.js");
    assert(normalized.includes("C++"), "cpp -> C++");
    assert(normalized.includes("C#"), "csharp -> C#");
    assert(normalized.includes("Tailwind CSS"), "tailwindcss -> Tailwind CSS");
    assert(normalized.includes("REST API"), "restful api -> REST API");
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Java versus JavaScript distinction
  // ─────────────────────────────────────────────────────────────
  runCase("5. Strict distinction: Java vs JavaScript", () => {
    assert.strictEqual(isSkillMatch("Java", "JavaScript"), false, "Java must not match JavaScript");
    assert.strictEqual(isSkillMatch("JavaScript", "Java"), false, "JavaScript must not match Java");

    const javaText = "Backend services engineered in Java with Spring Boot.";
    const javaSkills = extractSkillsFromText(javaText);
    assert(javaSkills.includes("Java"), "Must extract Java");
    assert(!javaSkills.includes("JavaScript"), "Must NOT extract JavaScript from Java-only text");

    const jsText = "Frontend UI components developed in JavaScript and HTML.";
    const jsSkills = extractSkillsFromText(jsText);
    assert(jsSkills.includes("JavaScript"), "Must extract JavaScript");
    assert(!jsSkills.includes("Java"), "Must NOT extract Java from JavaScript-only text");
  });

  // ─────────────────────────────────────────────────────────────
  // 6. C versus CSS and CI/CD distinction
  // ─────────────────────────────────────────────────────────────
  runCase("6. Strict distinction: C vs CSS vs CI/CD vs C++ vs C#", () => {
    assert.strictEqual(isSkillMatch("C", "CSS"), false, "C must not match CSS");
    assert.strictEqual(isSkillMatch("CSS", "C"), false, "CSS must not match C");
    assert.strictEqual(isSkillMatch("C", "CI/CD"), false, "C must not match CI/CD");
    assert.strictEqual(isSkillMatch("C", "C++"), false, "C must not match C++");
    assert.strictEqual(isSkillMatch("C", "C#"), false, "C must not match C#");

    const cssText = "Proficient in HTML, CSS, and CI/CD pipelines with GitHub Actions.";
    const cssSkills = extractSkillsFromText(cssText);
    assert(cssSkills.includes("CSS"), "Must extract CSS");
    assert(cssSkills.includes("CI/CD"), "Must extract CI/CD");
    assert(!cssSkills.includes("C"), "Must NOT extract C from CSS or CI/CD text");
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Genuine contextual mentions of C and R
  // ─────────────────────────────────────────────────────────────
  runCase("7. Genuine contextual mentions of C and R", () => {
    const textC = "Low-level kernel programming in ANSI C, C/C++, and embedded systems.";
    const skillsC = extractSkillsFromText(textC);
    assert(skillsC.includes("C"), "Must extract C when written in valid technical context");

    const textR = "Data analytics and statistical modeling using R programming and RStudio.";
    const skillsR = extractSkillsFromText(textR);
    assert(skillsR.includes("R"), "Must extract R when written in valid R programming context");
  });

  // ─────────────────────────────────────────────────────────────
  // 8. R false positives from React, Rust, Ruby, Docker, etc.
  // ─────────────────────────────────────────────────────────────
  runCase("8. R false positives from React, Rust, Ruby, Docker, TypeScript, GraphQL, Redux, (R)", () => {
    const textNoR = "Frontend engineer building with React, Redux, TypeScript, Docker, and Rust (Registered R&D project).";
    const extractedSkills = extractSkillsFromText(textNoR);

    assert(!extractedSkills.includes("R"), `Must NOT extract R from words starting or ending with R! Got: ${JSON.stringify(extractedSkills)}`);
    assert(extractedSkills.includes("React"), "Must extract React");
    assert(extractedSkills.includes("TypeScript"), "Must extract TypeScript");
    assert(extractedSkills.includes("Docker"), "Must extract Docker");
    assert(extractedSkills.includes("Rust"), "Must extract Rust");

    // Engine isSkillMatch check
    const falseMatchCandidates = ["React", "Rust", "Ruby", "Docker", "TypeScript", "GraphQL", "Redux", "HTML", "CSS"];
    for (const tech of falseMatchCandidates) {
      assert.strictEqual(isSkillMatch("R", tech), false, `'R' must not match '${tech}'`);
      assert.strictEqual(isSkillMatch(tech, "R"), false, `'${tech}' must not match 'R'`);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Node.js versus Next.js distinction
  // ─────────────────────────────────────────────────────────────
  runCase("9. Strict distinction: Node.js vs Next.js", () => {
    assert.strictEqual(isSkillMatch("Node.js", "Next.js"), false, "Node.js must not match Next.js");
    assert.strictEqual(isSkillMatch("Next.js", "Node.js"), false, "Next.js must not match Node.js");

    const nextOnly = "Building server-rendered React applications using Next.js 14.";
    const nextSkills = extractSkillsFromText(nextOnly);
    assert(nextSkills.includes("Next.js"), "Must extract Next.js");
    assert(!nextSkills.includes("Node.js"), "Must NOT extract Node.js from Next.js text");

    const nodeOnly = "Backend API server built with Node.js and Express.";
    const nodeSkills = extractSkillsFromText(nodeOnly);
    assert(nodeSkills.includes("Node.js"), "Must extract Node.js");
    assert(!nodeSkills.includes("Next.js"), "Must NOT extract Next.js from Node.js text");
  });

  // ─────────────────────────────────────────────────────────────
  // 10. OOP and AI/ML phrase recognition
  // ─────────────────────────────────────────────────────────────
  runCase("10. OOP and AI/ML phrase recognition (Object-Oriented Programming, AI/ML, Machine Learning)", () => {
    const text = "Strong foundation in Object-Oriented Programming (OOPs), Data Structures, Algorithms, and AI/ML.";
    const skills = extractSkillsFromText(text);

    assert(skills.includes("OOP"), "Must extract OOP from Object-Oriented Programming");
    assert(skills.includes("AI/ML"), "Must extract AI/ML from AI/ML");
    assert(skills.includes("Data Structures"), "Must extract Data Structures");
    assert(skills.includes("Algorithms"), "Must extract Algorithms");
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Duplicate skills across summary, skills, and projects sections
  // ─────────────────────────────────────────────────────────────
  runCase("11. Duplicate skills deduplication across sections", () => {
    const rawSkills = ["React", "react.js", "TypeScript", "REACT", "typescript"];
    const otherData = {
      summary: "React and TypeScript developer.",
      experience: [{ role: "React developer", bullets: ["Built frontend with TypeScript and React"] }],
    };
    const rawText = "Skills: React, TypeScript, ReactJS, TS";

    const normalized = normalizeExtractedSkills(rawSkills, otherData, rawText);
    const reactCount = normalized.filter((s) => s.toLowerCase() === "react").length;
    const tsCount = normalized.filter((s) => s.toLowerCase() === "typescript").length;

    assert.strictEqual(reactCount, 1, `React must be present exactly once, got count: ${reactCount}`);
    assert.strictEqual(tsCount, 1, `TypeScript must be present exactly once, got count: ${tsCount}`);
  });

  // ─────────────────────────────────────────────────────────────
  // 12. Skills mentioned only as unrelated prose or interests
  // ─────────────────────────────────────────────────────────────
  runCase("12. Skills mentioned only as unrelated prose or interests", () => {
    const proseText =
      "Enjoys reading literature, hiking in nature, traveling across Europe, cooking Italian recipes, and playing guitar.";
    const skills = extractSkillsFromText(proseText);
    assert.strictEqual(skills.length, 0, `Unrelated prose must not produce fabricated skills, got: ${JSON.stringify(skills)}`);
  });

  // ─────────────────────────────────────────────────────────────
  // 13. Empty, malformed, and image-only PDF handling
  // ─────────────────────────────────────────────────────────────
  runCase("13. Empty, malformed, and image-only PDF handling", () => {
    assert.strictEqual(extractTextFromPdfBuffer(Buffer.alloc(0)), "", "0-byte buffer produces empty text");

    const scannedImagePdf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /XObject /Subtype /Image /Width 100 /Height 100 >>\nstream\n\x00\x01\x02\x03\xff\xfe\nendstream\nendobj\n%%EOF"
    );
    assert.strictEqual(extractTextFromPdfBuffer(scannedImagePdf).trim(), "", "Scanned image PDF produces empty text");
  });

  // ─────────────────────────────────────────────────────────────
  // 14. AI timeout, malformed response, and deterministic fallback
  // ─────────────────────────────────────────────────────────────
  runCase("14. Deterministic fallback when AI returns invalid JSON or fails", () => {
    const resumeText =
      "Jane Doe\njane@example.com\n(555) 123-4567\nFull Stack Developer proficient in Java, Python, React, Docker, and PostgreSQL.";

    // Simulate AI returning empty / malformed response (fallback directly from text)
    const skills = normalizeExtractedSkills([], null, resumeText);
    assert(skills.includes("Java"), "Fallback must extract Java");
    assert(skills.includes("Python"), "Fallback must extract Python");
    assert(skills.includes("React"), "Fallback must extract React");
    assert(skills.includes("Docker"), "Fallback must extract Docker");
    assert(skills.includes("PostgreSQL"), "Fallback must extract PostgreSQL");
  });

  // ─────────────────────────────────────────────────────────────
  // 15. No fabricated skills when neither AI nor deterministic finds evidence
  // ─────────────────────────────────────────────────────────────
  runCase("15. No fabricated skills on non-technical content", () => {
    const nonTechText =
      "John Smith - Hotel Front Desk Supervisor. Managed guest relations, reservations, and customer check-in procedures.";
    const skills = normalizeExtractedSkills([], null, nonTechText);
    assert.strictEqual(skills.length, 0, "Non-technical resume must result in 0 skills without fabrication");
  });

  // ─────────────────────────────────────────────────────────────
  // 16. Full pipeline test with the failing resume fixture: Java, Python, OOP, AI/ML, VS Code, Figma
  // ─────────────────────────────────────────────────────────────
  await runAsyncCase("16. Representative Resume Fixture: Java, Python, OOP, AI/ML, VS Code, Figma", async () => {
    const resumeText = `
John Developer
john.dev@example.com
(555) 987-6543
Software Engineer with expertise in Java, Python, OOP, AI/ML, VS Code, and Figma.

Technical Skills:
- Languages & Core: Java, Python, OOP (Object-Oriented Programming)
- Technologies & Tools: AI/ML, Machine Learning, VS Code, Figma, Git
    `;

    const pdfBuffer = createSyntheticPdfBuffer(resumeText, true);
    const extractedText = extractTextFromPdfBuffer(pdfBuffer);
    assert(extractedText.length > 0, "PDF extraction must succeed");

    const skills = normalizeExtractedSkills(null, {}, extractedText);

    // Verify all 6 core skills from the problem prompt are extracted
    assert(skills.includes("Java"), `Must extract Java, got: ${JSON.stringify(skills)}`);
    assert(skills.includes("Python"), `Must extract Python, got: ${JSON.stringify(skills)}`);
    assert(skills.includes("OOP"), `Must extract OOP, got: ${JSON.stringify(skills)}`);
    assert(skills.includes("AI/ML"), `Must extract AI/ML, got: ${JSON.stringify(skills)}`);
    assert(skills.includes("VS Code"), `Must extract VS Code, got: ${JSON.stringify(skills)}`);
    assert(skills.includes("Figma"), `Must extract Figma, got: ${JSON.stringify(skills)}`);

    // Verify assessment engine processes this cleanly
    const mockGitHubData = {
      languages: {
        languages: [
          { name: "Java", percentage: 60, bytes: 40000 },
          { name: "Python", percentage: 40, bytes: 25000 },
        ],
      },
      projects: {
        topRepos: [
          {
            name: "ml-classifier",
            url: "https://github.com/john/ml-classifier",
            language: "Python",
            topics: ["machine-learning", "ai"],
            evidence: {
              tests: [{ name: "test_model.py", path: "tests/test_model.py" }],
              packageManifests: [{ name: "requirements.txt", ecosystem: "pypi", path: "requirements.txt" }],
              recentCommits: [{ shortSha: "1a2b3c", message: "feat: add classification model" }],
            },
          },
        ],
      },
    };

    const assessment = await runSkillEvidenceAssessment({
      resumeSkills: skills,
      githubData: mockGitHubData,
      targetRoleName: "Backend Engineer",
      githubUsername: "john",
    });

    assert.strictEqual(assessment.skills.length, skills.length, "Assessment skills count must match resume skills");

    const javaEval = assessment.skills.find((s) => s.skill === "Java")!;
    assert.strictEqual(javaEval.classification, "PROVEN", "Java should be PROVEN");
    assert.strictEqual(javaEval.roleRelevance, "CORE", "Java should be CORE for Backend Engineer");

    const pythonEval = assessment.skills.find((s) => s.skill === "Python")!;
    assert.strictEqual(pythonEval.classification, "PROVEN", "Python should be PROVEN");

    const figmaEval = assessment.skills.find((s) => s.skill === "Figma")!;
    assert.strictEqual(figmaEval.classification, "CLAIMED-ONLY", "Figma without public repo code should be CLAIMED-ONLY");

    assert(assessment.metrics.provenSkillsCount >= 2, "Proven count must be >= 2");
    assert(assessment.metrics.claimedOnlySkillsCount >= 1, "Claimed only count must be >= 1");
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
