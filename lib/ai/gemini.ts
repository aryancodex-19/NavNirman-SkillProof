import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import zlib from "zlib";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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

  try {
    const groq = new Groq({ apiKey: groqApiKey });
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (groqErr: any) {
    console.error("Groq fallback error:", groqErr);
    throw new Error("AI models are currently experiencing high demand. Please try again in a few moments.");
  }
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
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
          { role: "user" as const, content: textParts.join("\n") },
        ],
        temperature: 0.2,
        response_format: responseMimeType === "application/json" ? { type: "json_object" } : undefined,
      });
      return completion.choices[0]?.message?.content || "{}";
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
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
            { role: "user" as const, content: textParts.join("\n") },
          ],
          temperature: 0.2,
          response_format: responseMimeType === "application/json" ? { type: "json_object" } : undefined,
        });
        return completion.choices[0]?.message?.content || "{}";
      } catch (groqErr) {
        console.error("Groq fallback also failed:", groqErr);
      }
    }

    throw geminiErr;
  }
}

/**
 * Resilient PDF text extraction helper that handles uncompressed and zlib FlateDecode streams,
 * Tj string operators, TJ array operators, and hex-encoded text.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  if (!buffer || buffer.length === 0) return "";

  const textPieces: string[] = [];
  const rawString = buffer.toString("binary");

  function extractFromStreamText(streamText: string) {
    if (!streamText) return;

    // 1. Tj operators: (string) Tj or ' or " with support for escaped parens
    const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(streamText)) !== null) {
      if (match[1]) {
        const cleaned = match[1]
          .replace(/\\([()\\])/g, "$1")
          .replace(/\\r/g, " ")
          .replace(/\\n/g, " ")
          .replace(/\\t/g, " ")
          .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .trim();
        if (cleaned.length > 0) textPieces.push(cleaned);
      }
    }

    // 2. TJ array operators: [(str1) 20 (str2) <00480065> 10 (str3)] TJ
    const tjArrayRegex = /\[((?:[^[\]\\]|\\.)*)\]\s*TJ/gi;
    while ((match = tjArrayRegex.exec(streamText)) !== null) {
      const inner = match[1];
      const arrayPieces: string[] = [];

      // Extract string tokens (...) and hex tokens <...> within TJ array
      const tokenRegex = /\(((?:[^()\\]|\\.)*)\)|<([0-9a-fA-F\s]+)>/g;
      let tokenMatch;
      while ((tokenMatch = tokenRegex.exec(inner)) !== null) {
        if (tokenMatch[1] !== undefined) {
          const str = tokenMatch[1]
            .replace(/\\([()\\])/g, "$1")
            .replace(/\\r/g, " ")
            .replace(/\\n/g, " ")
            .replace(/\\t/g, " ")
            .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
          if (str) arrayPieces.push(str);
        } else if (tokenMatch[2] !== undefined) {
          const hex = tokenMatch[2].replace(/\s+/g, "");
          if (hex.length >= 2 && hex.length % 2 === 0) {
            try {
              // Try UTF-16BE if length is multiple of 4 and starts with 00
              if (hex.length % 4 === 0 && hex.startsWith("00")) {
                const utf16 = Buffer.from(hex, "hex").swap16().toString("utf16le");
                const cleaned = utf16.replace(/[^\x20-\x7E\t\n]/g, " ").trim();
                if (cleaned) arrayPieces.push(cleaned);
              } else {
                const ascii = Buffer.from(hex, "hex").toString("utf8");
                const cleaned = ascii.replace(/[^\x20-\x7E\t\n]/g, " ").trim();
                if (cleaned) arrayPieces.push(cleaned);
              }
            } catch {
              // Ignore hex decode failure
            }
          }
        }
      }

      if (arrayPieces.length > 0) {
        textPieces.push(arrayPieces.join(" "));
      }
    }

    // 3. Hex string Tj operators: <48656c6c6f> Tj
    const hexTjRegex = /<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g;
    while ((match = hexTjRegex.exec(streamText)) !== null) {
      const hex = match[1].replace(/\s+/g, "");
      if (hex.length >= 2 && hex.length % 2 === 0) {
        try {
          if (hex.length % 4 === 0 && hex.startsWith("00")) {
            const utf16 = Buffer.from(hex, "hex").swap16().toString("utf16le");
            const cleaned = utf16.replace(/[^\x20-\x7E\t\n]/g, " ").trim();
            if (cleaned) textPieces.push(cleaned);
          } else {
            const ascii = Buffer.from(hex, "hex").toString("utf8");
            const cleaned = ascii.replace(/[^\x20-\x7E\t\n]/g, " ").trim();
            if (cleaned) textPieces.push(cleaned);
          }
        } catch {
          // ignore hex decode errors
        }
      }
    }
  }

  // 1. Extract from all stream ... endstream blocks (decompressing FlateDecode)
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch;

  while ((streamMatch = streamRegex.exec(rawString)) !== null) {
    const streamContent = streamMatch[1];
    const streamBuffer = Buffer.from(streamContent, "binary");

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
          decompressed = streamContent;
        }
      }
    }

    if (decompressed) {
      extractFromStreamText(decompressed);
    }
  }

  // 2. If no streams yielded text, scan raw PDF content for standard text string blocks
  if (textPieces.length === 0) {
    extractFromStreamText(rawString);
  }

  return textPieces.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Standard technical skill dictionary used for deterministic safety-net detection
 */
export const KNOWN_TECHNICAL_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Golang", "Rust", "Ruby",
  "PHP", "Swift", "Kotlin", "Dart", "Scala", "R", "SQL", "HTML", "HTML5", "CSS", "CSS3",
  "React", "React.js", "ReactJS", "Next.js", "NextJS", "Vue", "Vue.js", "Angular", "Svelte",
  "Tailwind CSS", "TailwindCSS", "Tailwind", "Bootstrap", "Redux", "Zustand", "GraphQL", "REST API", "APIs",
  "Node.js", "NodeJS", "Node", "Express", "Express.js", "NestJS", "FastAPI", "Django", "Flask", "Spring Boot",
  "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "SQLite", "Prisma", "Cassandra", "Supabase", "Firebase",
  "Docker", "Kubernetes", "K8s", "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Azure",
  "CI/CD", "GitHub Actions", "Git", "GitHub", "Linux", "Terraform", "Shell", "Bash", "Jest", "Pytest", "Vitest",
  "Cypress", "Playwright", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning",
  "Deep Learning", "Data Analysis", "System Design", "Microservices", "WebSockets", "Kafka", "RabbitMQ", "Flutter"
];

/**
 * Deterministic skill scanner that extracts known technical skills from text with strict boundary and context checks.
 * Prevents false positives on single-letter tokens ('R', 'C') and substring collisions ('Java' vs 'JavaScript').
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const foundSkills = new Set<string>();

  // Specific contextual checks for tricky/ambiguous tokens
  const lowerText = text.toLowerCase();

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

  // 6. C (strict context check to prevent false positives from grade C, vitamin C, bullet C, etc.)
  if (
    /\b(?:ansi\s+c|c\s+programming|c\s+language|c\s*\/\s*c\+\+|embedded\s+c)\b/i.test(text) ||
    /(?:languages|technical\s+skills)\s*:[^.\n]*?\bc\b(?!\+\+|#|[a-z])/i.test(text)
  ) {
    foundSkills.add("C");
  }

  // 7. R (strict context check to prevent false positives from (R), R&D, bullet R, middle initial)
  if (
    /\b(?:r\s+programming|r\s+language|rstudio|r\s+studio|r\s*\/\s*python|python\s*\/\s*r|cran|r-project)\b/i.test(text) ||
    /(?:languages|programming\s+languages)\s*:[^.\n]*?\br\b(?![a-z])/i.test(text)
  ) {
    foundSkills.add("R");
  }

  // 8. Go / Golang
  if (/\bgolang\b/i.test(text) || /\bgo\s+(?:language|programming|developer|backend|microservices)\b/i.test(text)) {
    foundSkills.add("Go");
  }

  // 9. Standard vocabulary skills (excluding manually handled tokens: Java, JavaScript, TypeScript, C++, C#, C, R, Go, Golang)
  const skipManual = new Set(["Java", "JavaScript", "TypeScript", "C++", "C#", "C", "R", "Go", "Golang"]);

  for (const skill of KNOWN_TECHNICAL_SKILLS) {
    if (skipManual.has(skill)) continue;

    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(?:^|[\\s,;:.(/\\[\\]{|])${escaped}(?:$|[\\s,;:.)\\]/}|])`, "i");

    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  }

  return Array.from(foundSkills);
}
