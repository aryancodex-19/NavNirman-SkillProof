import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { withTransientRetry, isTransientError } from "./gemini";

// Initialize both clients
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

const gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Route configuration
type TaskType =
  | "parse_resume"      // Gemini - needs multimodal PDF
  | "rewrite_content"   // Groq - fast text generation
  | "ats_score"         // Gemini + Groq both
  | "mentor_chat"       // Groq - low latency
  | "interview_eval"    // Groq - real-time
  | "linkedin_optimize" // Groq - short output
  | "portfolio_generate"; // Gemini - structured output

export async function routeAI(task: TaskType, input: any) {
  switch (task) {
    case "parse_resume":
      if (gemini) {
        try {
          return await withTransientRetry(
            async () => {
              const model = gemini.getGenerativeModel({
                model: "gemini-3.8-flash",
              });
              return await model.generateContent(input);
            },
            { operationName: "router parse_resume (Gemini)" }
          );
        } catch (geminiErr: any) {
          if (!isTransientError(geminiErr)) {
            throw geminiErr;
          }
          console.warn("Gemini parse_resume failed with transient error, attempting Groq fallback if text available...");
        }
      }

      // Groq fallback if input is text
      if (groq && typeof input === "string") {
        return await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: input }],
          response_format: { type: "json_object" },
        });
      }
      throw new Error("AI service is temporarily unavailable. Please try again in a moment.");

    case "rewrite_content":
    case "mentor_chat":
    case "interview_eval":
      if (!groq) {
        throw new Error("Groq AI service is not initialized.");
      }
      return await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: input.prompt || input }],
        temperature: 0.7,
      });

    case "linkedin_optimize":
      if (!groq) {
        throw new Error("Groq AI service is not initialized.");
      }
      return await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: input }],
        temperature: 0.5,
      });

    case "ats_score":
      if (gemini) {
        try {
          return await withTransientRetry(
            async () => {
              const model = gemini.getGenerativeModel({
                model: "gemini-3.8-flash",
                generationConfig: { responseMimeType: "application/json" },
              });
              return await model.generateContent(input);
            },
            { operationName: "router ats_score (Gemini)" }
          );
        } catch (geminiErr: any) {
          if (!isTransientError(geminiErr)) {
            throw geminiErr;
          }
          console.warn("Gemini ats_score failed with transient error, falling back to Groq...");
        }
      }

      if (groq) {
        const textContent = typeof input === "string" ? input : JSON.stringify(input);
        return await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: textContent }],
          response_format: { type: "json_object" },
        });
      }
      throw new Error("AI ATS scoring service is temporarily unavailable.");

    case "portfolio_generate":
      if (gemini) {
        try {
          return await withTransientRetry(
            async () => {
              const geminiModel = gemini.getGenerativeModel({
                model: "gemini-3.8-flash",
                generationConfig: { responseMimeType: "application/json" },
              });
              return await geminiModel.generateContent(input);
            },
            { operationName: "router portfolio_generate (Gemini)" }
          );
        } catch (geminiErr: any) {
          if (!isTransientError(geminiErr)) {
            throw geminiErr;
          }
          console.warn("Gemini portfolio_generate failed with transient error, falling back to Groq...");
        }
      }

      if (groq) {
        const textContent = typeof input === "string" ? input : JSON.stringify(input);
        const completion = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: "You are an expert web developer. Return valid JSON only." },
            { role: "user", content: textContent },
          ],
          response_format: { type: "json_object" },
        });
        return {
          response: {
            text: () => completion.choices[0]?.message?.content || "{}",
          },
        };
      }
      throw new Error("AI portfolio generation service is temporarily unavailable.");

    default:
      if (!groq) {
        throw new Error("AI service is not initialized.");
      }
      return await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: input }],
      });
  }
}
