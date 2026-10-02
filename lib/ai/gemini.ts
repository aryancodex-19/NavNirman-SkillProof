import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import zlib from "zlib";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/** Groq model priority chain — first available / non-empty response wins. */
export const GROQ_PRIMARY_MODEL = "openai/gpt-oss-120b";
export const GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile";

/**
 * Checks whether an error is transient (e.g. 503 high demand, 429 rate limit, 502/504 gateway, network failure).
 * Returns false for permanent client errors like invalid API keys or malformed requests.
 */
export function isTransientError(error: any): boolean {
  if (!error) return false;

  const status = error.status || error.statusCode || error.response?.status;
  if (status === 503 || status === 429 || status === 502 || status === 504 || status === 500) {
    return true;
  }

  const message = (error.message || error.toString() || "").toLowerCase();

  // Explicitly disallow fallback for permanent auth / client errors
  if (
    message.includes("api_key_invalid") ||
    message.includes("api key not valid") ||
    message.includes("permission_denied") ||
    message.includes("invalid_argument") ||
    message.includes("unauthorized") ||
    message.includes("401") ||
    message.includes("403")
  ) {
    return false;
  }

  if (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("resource has been exhausted") ||
    message.includes("rate limit") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("socket hang up") ||
    message.includes("model is currently experiencing")
  ) {
    return true;
  }

  return false;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
  operationName?: string;
}

/**
 * Executes an async operation with bounded exponential backoff and jitter for transient errors.
 */
export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 800;
  const backoffFactor = options.backoffFactor ?? 2;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const operationName = options.operationName ?? "AI Operation";

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (attempt > maxRetries || !isTransientError(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
      const jitter = Math.random() * (cappedDelay * 0.3); // 0-30% jitter
      const delay = Math.round(cappedDelay + jitter);

      console.warn(
        `[${operationName}] Transient failure on attempt ${attempt}/${maxRetries + 1} (${error.message || error}). Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Helper to generate text content using Gemini with automatic retries and Groq fallback.
 */
export async function generateContent(prompt: string, systemInstruction?: string): Promise<string> {
  // 1. Attempt with Gemini if configured
  if (genAI) {
    try {
      return await withTransientRetry(
        async () => {
          const model = genAI!.getGenerativeModel({
            model: "gemini-3.8-flash",
            systemInstruction,
          });
          const result = await model.generateContent(prompt);
          return result.response.text();
        },
        { operationName: "Gemini generateContent" }
      );
    } catch (geminiErr: any) {
      if (!isTransientError(geminiErr)) {
        throw geminiErr;
      }
      console.warn("Gemini unavailable after retries, falling back to Groq provider...");
    }
  }

  // 2. Fall back to Groq if Gemini failed or is not initialized
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("AI service is currently unavailable. Please try again in a few moments.");
  }

  const groq = new Groq({ apiKey: groqApiKey });
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  // Try primary model first, fall back to secondary if empty response
  for (const model of [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL]) {
    try {
      const completion = await groq.chat.completions.create({ model, messages, temperature: 0.5 });
      const text = completion.choices[0]?.message?.content;
      if (text) return text;
      console.warn(`[generateContent] Groq model ${model} returned empty content, trying fallback...`);
    } catch (groqErr: any) {
      console.warn(`[generateContent] Groq model ${model} error: ${groqErr?.message}`);
      if (model === GROQ_FALLBACK_MODEL) {
        throw new Error("AI models are currently experiencing high demand. Please try again in a few moments.");
      }
    }
  }
  throw new Error("AI models are currently experiencing high demand. Please try again in a few moments.");
}

/**
 * Helper to generate content from parts (e.g. text + files/base64 blobs) with bounded retry and text fallback.
 */
export async function generateContentFromParts(
  parts: any[],
  systemInstruction?: string,
  responseMimeType?: string
): Promise<string> {
  if (!genAI) {
    // If pure text parts, try Groq fallback directly
    const textParts = parts.filter((p) => typeof p === "string" || (p && p.text)).map((p) => p.text || p);
    if (textParts.length > 0 && process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const groqMessages = [
        ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
        { role: "user" as const, content: textParts.join("\n").slice(0, 14000) },
      ];
      const responseFormat = responseMimeType === "application/json" ? { type: "json_object" as const } : undefined;
      for (const model of [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL]) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: groqMessages,
            temperature: 0.2,
            response_format: responseFormat,
          });
          const text = completion.choices[0]?.message?.content;
          if (text) return text;
          console.warn(`[generateContentFromParts no-gemini] Groq model ${model} returned empty, trying fallback...`);
        } catch (groqErr: any) {
          console.warn(`[generateContentFromParts no-gemini] Groq ${model} error: ${groqErr?.message}`);
        }
      }
      return "{}";
    }
    throw new Error("Gemini AI is not initialized. Please check configuration.");
  }

  try {
    return await withTransientRetry(
      async () => {
        const model = genAI!.getGenerativeModel({
          model: "gemini-3.8-flash",
          systemInstruction,
          generationConfig: responseMimeType ? { responseMimeType } : undefined,
        });

        const result = await model.generateContent(parts);
        return result.response.text();
      },
      { operationName: "Gemini generateContentFromParts" }
    );
  } catch (geminiErr: any) {
    if (!isTransientError(geminiErr)) {
      throw geminiErr;
    }

    // Attempt Groq fallback for text-convertible parts
    const textParts = parts.filter((p) => typeof p === "string" || (p && p.text)).map((p) => p.text || p);
    if (textParts.length > 0 && process.env.GROQ_API_KEY) {
      console.warn("Gemini parts call failed with transient error. Falling back to Groq for text content...");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const groqMessages = [
        ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
        { role: "user" as const, content: textParts.join("\n").slice(0, 14000) },
      ];
      const responseFormat = responseMimeType === "application/json" ? { type: "json_object" as const } : undefined;
      for (const model of [GROQ_PRIMARY_MODEL, GROQ_FALLBACK_MODEL]) {
        try {
          const completion = await groq.chat.completions.create({
            model,
            messages: groqMessages,
            temperature: 0.2,
            response_format: responseFormat,
          });
          const text = completion.choices[0]?.message?.content;
          if (text) return text;
          console.warn(`[generateContentFromParts] Groq model ${model} returned empty content, trying fallback...`);
        } catch (groqErr: any) {
          console.warn(`[generateContentFromParts] Groq model ${model} error: ${groqErr?.message}`);
          if (model === GROQ_FALLBACK_MODEL) console.error("Both Groq models failed.", groqErr);
        }
      }
    }

    throw geminiErr;
  }
}

/**
 * Resilient PDF text extraction helper that handles uncompressed and zlib FlateDecode streams,
 * length-based stream slicing, intra-word kerning in TJ arrays, Tj string operators,
 * UTF-16BE/ASCII hex strings, ligatures, and character normalization.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) return "";

  const textPieces: string[] = [];
  const rawBinary = buffer.toString("binary");

  function decodeOctalString(str: string): string {
    return str
      .replace(/\\([()\\])/g, "$1")
      .replace(/\\r/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, " ")
      .replace(/\\b/g, "")
      .replace(/\\f/g, "")
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  }

  function decodeHexString(hexRaw: string): string {
    const hex = hexRaw.replace(/\s+/g, "");
    if (hex.length < 2 || hex.length % 2 !== 0) return "";
    try {
      if (hex.length % 4 === 0 && hex.startsWith("00")) {
        return Buffer.from(hex, "hex").swap16().toString("utf16le").replace(/[^\x20-\x7E\t\n]/g, " ");
      } else {
        return Buffer.from(hex, "hex").toString("utf8").replace(/[^\x20-\x7E\t\n]/g, " ");
      }
    } catch {
      return "";
    }
  }

  function extractFromStreamText(streamText: string) {
    if (!streamText) return;

    // 1. Process TJ Array operators: [(str1) -20 (str2) 200 (str3)] TJ
    // Respect kerning: adjacent characters are concatenated without spaces,
    // while spacing kerning (displacement <= -150 or >= 150) inserts a word boundary space.
    const tjArrayRegex = /\[((?:[^[\]\\]|\\.)*)\]\s*TJ/gi;
    let match;
    while ((match = tjArrayRegex.exec(streamText)) !== null) {
      const inner = match[1];
      const tokenRegex = /\(((?:[^()\\]|\\.)*)\)|<([0-9a-fA-F\s]+)>|([-+]?\d+(?:\.\d+)?)/g;
      let tokenMatch;
      let lineAcc = "";

      while ((tokenMatch = tokenRegex.exec(inner)) !== null) {
        if (tokenMatch[1] !== undefined) {
          const decoded = decodeOctalString(tokenMatch[1]);
          lineAcc += decoded;
        } else if (tokenMatch[2] !== undefined) {
          const decoded = decodeHexString(tokenMatch[2]);
          lineAcc += decoded;
        } else if (tokenMatch[3] !== undefined) {
          const displacement = parseFloat(tokenMatch[3]);
          if (displacement <= -150 || displacement >= 150) {
            if (lineAcc.length > 0 && !lineAcc.endsWith(" ")) {
              lineAcc += " ";
            }
          }
        }
      }

      if (lineAcc.trim().length > 0) {
        textPieces.push(lineAcc.trim());
      }
    }

    // 2. Process Tj string operators: (string) Tj or ' or "
    const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g;
    while ((match = tjRegex.exec(streamText)) !== null) {
      if (match[1]) {
        const decoded = decodeOctalString(match[1]).trim();
        if (decoded.length > 0) textPieces.push(decoded);
      }
    }

    // 3. Process Hex string Tj operators: <48656c6c6f> Tj
    const hexTjRegex = /<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g;
    while ((match = hexTjRegex.exec(streamText)) !== null) {
      if (match[1]) {
        const decoded = decodeHexString(match[1]).trim();
        if (decoded.length > 0) textPieces.push(decoded);
      }
    }
  }

  // 1. Scan and decompress streams with /Length support
  const objectRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let objMatch;
  let foundStreams = 0;

  while ((objMatch = objectRegex.exec(rawBinary)) !== null) {
    foundStreams++;
    const dictHeader = objMatch[1];
    let streamRaw = objMatch[2];

    const lengthMatch = dictHeader.match(/\/Length\s+(\d+)/);
    if (lengthMatch) {
      const explicitLen = parseInt(lengthMatch[1], 10);
      const streamStartPos = objMatch.index + objMatch[0].indexOf("stream") + (rawBinary.charAt(objMatch.index + objMatch[0].indexOf("stream") + 6) === "\r" ? 8 : 7);
      if (streamStartPos + explicitLen <= buffer.length) {
        streamRaw = rawBinary.slice(streamStartPos, streamStartPos + explicitLen);
      }
    }

    const streamBuffer = Buffer.from(streamRaw, "binary");
    let decompressed: string | null = null;

    try {
      decompressed = zlib.inflateSync(streamBuffer).toString("utf8");
    } catch {
      try {
        decompressed = zlib.inflateRawSync(streamBuffer).toString("utf8");
      } catch {
        try {
          decompressed = zlib.unzipSync(streamBuffer).toString("utf8");
        } catch {
          decompressed = streamRaw;
        }
      }
    }

    if (decompressed) {
      extractFromStreamText(decompressed);
    }
  }

  // 2. Generic stream ... endstream fallback if object header regex missed
  if (foundStreams === 0 || textPieces.length === 0) {
    const genericStreamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let genMatch;
    while ((genMatch = genericStreamRegex.exec(rawBinary)) !== null) {
      const streamContent = genMatch[1];
      const streamBuf = Buffer.from(streamContent, "binary");
      let decompressed: string | null = null;
      try {
        decompressed = zlib.inflateSync(streamBuf).toString("utf8");
      } catch {
        try {
          decompressed = zlib.inflateRawSync(streamBuf).toString("utf8");
        } catch {
          decompressed = streamContent;
        }
      }
      if (decompressed) {
        extractFromStreamText(decompressed);
      }
    }
  }

  // 3. Fallback to raw binary scan if still empty
  if (textPieces.length === 0) {
    extractFromStreamText(rawBinary);
  }

  return textPieces
    .join(" ")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/\uFB00/g, "ff")
    .replace(/\uFB05/g, "st")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u2023\u25CF\u25E6\u2043\u2219]/g, " • ")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/**
 * Standard technical skill dictionary used for deterministic safety-net detection
 */
export const KNOWN_TECHNICAL_SKILLS = [
  // Programming Languages
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Golang", "Rust", "Ruby",
  "PHP", "Swift", "Kotlin", "Dart", "Scala", "R", "SQL", "HTML", "HTML5", "CSS", "CSS3",
  // Web & Frontend Technologies
  "React", "React.js", "ReactJS", "Next.js", "NextJS", "Vue", "Vue.js", "VueJS", "Angular", "Svelte",
  "Tailwind CSS", "TailwindCSS", "Tailwind", "Bootstrap", "Redux", "Zustand", "GraphQL", "REST API", "APIs",
  // Backend & Runtime
  "Node.js", "NodeJS", "Node", "Express", "Express.js", "NestJS", "FastAPI", "Django", "Flask", "Spring Boot",
  "Flutter", "React Native",
  // Databases & Storage
  "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "SQLite", "Prisma", "Cassandra", "Supabase", "Firebase",
  "DynamoDB", "Elasticsearch",
  // Cloud, DevOps & Systems
  "Docker", "Kubernetes", "K8s", "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Azure",
  "CI/CD", "GitHub Actions", "Git", "GitHub", "GitLab", "Linux", "Terraform", "Shell", "Bash", "Helm", "Prometheus", "Grafana",
  // Testing & QA
  "Testing", "Jest", "Pytest", "Vitest", "Cypress", "Playwright",
  // AI, Data & Machine Learning
  "AI/ML", "Machine Learning", "Deep Learning", "Data Analysis", "Data Science", "Artificial Intelligence",
  "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Keras", "OpenCV", "NLP", "Computer Vision", "LLMs",
  // Engineering Concepts
  "OOP", "Object-Oriented Programming", "Data Structures", "Algorithms", "System Design", "Microservices", "API Development",
  // Developer Tools & Design
  "VS Code", "Visual Studio Code", "Figma", "Postman", "Jira"
];

/**
 * Deterministic skill scanner that extracts known technical skills from text with strict boundary and context checks.
 * Prevents false positives on single-letter tokens ('R', 'C') and substring collisions ('Java' vs 'JavaScript').
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const foundSkills = new Set<string>();

  // 1. Java (must NOT match JavaScript)
  if (/\bjava\b(?!script|[a-z])/i.test(text)) {
    foundSkills.add("Java");
  }

  // 2. JavaScript
  if (/\b(?:javascript|ecmascript)\b/i.test(text) || /\bjs\b/i.test(text)) {
    foundSkills.add("JavaScript");
  }

  // 3. TypeScript
  if (/\btypescript\b/i.test(text) || /\bts\b/i.test(text)) {
    foundSkills.add("TypeScript");
  }

  // 4. C++
  if (/(?:^|[\s,;:(/])(?:c\+\+|cpp|cplusplus)(?:$|[\s,;:./)\]])/i.test(text)) {
    foundSkills.add("C++");
  }

  // 5. C#
  if (/(?:^|[\s,;:(/])(?:c#|csharp|c\s+sharp)(?:$|[\s,;:./)\]])/i.test(text)) {
    foundSkills.add("C#");
  }

  // 6. .NET
  if (/(?:^|[\s,;:(/])(?:\.net|dotnet|net\s+core|asp\.net)(?:$|[\s,;:./)\]])/i.test(text)) {
    foundSkills.add(".NET");
  }

  // 7. C (strict context check to prevent false positives from grade C, vitamin C, bullet C, CSS, etc.)
  if (
    /\b(?:ansi\s+c|c\s+programming|c\s+language|c\s*\/\s*c\+\+|embedded\s+c)\b/i.test(text) ||
    /(?:languages|technical\s+skills|programming\s+languages)\s*:[^.\n]*?\bc\b(?!\+\+|#|[a-z])/i.test(text)
  ) {
    foundSkills.add("C");
  }

  // 8. R (strict context check to prevent false positives from (R), R&D, bullet R, middle initial, React, Rust)
  if (
    /\b(?:r\s+programming|r\s+language|rstudio|r\s+studio|r\s*\/\s*python|python\s*\/\s*r|cran|r-project)\b/i.test(text) ||
    /(?:languages|programming\s+languages)\s*:[^.\n]*?\br\b(?![a-z])/i.test(text)
  ) {
    foundSkills.add("R");
  }

  // 9. Go / Golang (recognized via golang, go language/programming/backend, or listed in tech skills/languages list)
  if (
    /\bgolang\b/i.test(text) ||
    /\bgo\s+(?:lang|language|programming|developer|backend|microservices|code)\b/i.test(text) ||
    /(?:languages?|skills?|proficient in|technologies?|stack)\s*:[^.\n]*?\bgo\b/i.test(text) ||
    /(?:java|python|rust|c\+\+|kotlin|typescript|c#|scala|ruby)\s*,\s*go\b/i.test(text) ||
    /\bgo\s*,\s*(?:rust|java|python|kotlin|typescript|sql|c\+\+)/i.test(text)
  ) {
    foundSkills.add("Go");
  }

  // 10. OOP / Object-Oriented Programming
  if (/\b(?:oop|oops|object[\s-]oriented\s+programming)\b/i.test(text)) {
    foundSkills.add("OOP");
  }

  // 11. AI/ML / Machine Learning / Deep Learning
  if (/\b(?:ai\s*[\/&]\s*ml|ai\s+and\s+ml)\b/i.test(text)) {
    foundSkills.add("AI/ML");
  }
  if (/\bmachine\s+learning\b/i.test(text)) {
    foundSkills.add("Machine Learning");
  }
  if (/\bdeep\s+learning\b/i.test(text)) {
    foundSkills.add("Deep Learning");
  }
  if (/\bdata\s+analysis\b/i.test(text)) {
    foundSkills.add("Data Analysis");
  }

  // 12. VS Code / Visual Studio Code
  if (/\b(?:vs\s*code|visual\s+studio\s+code)\b/i.test(text)) {
    foundSkills.add("VS Code");
  }

  // 13. Figma
  if (/\bfigma\b/i.test(text)) {
    foundSkills.add("Figma");
  }

  // 14. Data Structures & Algorithms
  if (/\bdata\s+structures?\b/i.test(text)) {
    foundSkills.add("Data Structures");
  }
  if (/\balgorithms?\b/i.test(text)) {
    foundSkills.add("Algorithms");
  }
  if (/\bdsa\b/i.test(text)) {
    foundSkills.add("Data Structures");
    foundSkills.add("Algorithms");
  }

  // 15. Testing / QA
  if (/\b(?:unit\s+testing|integration\s+testing|test[\s-]driven\s+development|automated\s+testing|tdd)\b/i.test(text)) {
    foundSkills.add("Testing");
  }

  // 16. API Development / REST API
  if (/\b(?:api\s+development|restful\s+apis?|rest\s+api|api\s+design)\b/i.test(text)) {
    foundSkills.add("REST API");
    foundSkills.add("API Development");
  }

  // 17. CI/CD
  if (/\b(?:ci\s*[\/]\s*cd|continuous\s+integration|github\s+actions)\b/i.test(text)) {
    foundSkills.add("CI/CD");
  }

  // 18. Node.js and Next.js distinct recognition
  if (/\b(?:node\.?js|nodejs)\b/i.test(text)) {
    foundSkills.add("Node.js");
  }
  if (/\b(?:next\.?js|nextjs)\b/i.test(text)) {
    foundSkills.add("Next.js");
  }

  // 19. Standard vocabulary scanner
  const manuallyHandled = new Set([
    "Java", "JavaScript", "TypeScript", "C++", "C#", "C", ".NET", "R", "Go", "Golang",
    "OOP", "Object-Oriented Programming", "AI/ML", "Machine Learning", "Deep Learning", "Data Analysis",
    "VS Code", "Visual Studio Code", "Figma", "Data Structures", "Algorithms", "Testing",
    "REST API", "APIs", "API Development", "CI/CD", "Node.js", "NodeJS", "Node", "Next.js", "NextJS"
  ]);

  for (const skill of KNOWN_TECHNICAL_SKILLS) {
    if (manuallyHandled.has(skill)) continue;

    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;:.(/\\[\\]{|•])${escaped}(?:$|[\\s,;:.)\\]/}|•])`, "i");

    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}
