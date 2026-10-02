import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Initialize both clients
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
            // Gemini 2.5 Flash - 1M context, can read PDFs directly
            const model = gemini.getGenerativeModel({
                model: "gemini-2.5-flash"  // Updated: 2.5 Flash is current [citation:4]
            });
            return await model.generateContent(input);

        case "rewrite_content":
        case "mentor_chat":
        case "interview_eval":
            // Groq - 594 tokens/sec on Llama 4 Scout [citation:4]
            return await groq.chat.completions.create({
                model: "llama-4-scout-128k",
                messages: [{ role: "user", content: input.prompt }],
                temperature: 0.7,
            });

        case "linkedin_optimize":
            // Groq - cheapest output at $0.34/MTok [citation:4]
            return await groq.chat.completions.create({
                model: "llama-4-scout-128k",
                messages: [{ role: "user", content: input }],
                temperature: 0.5,
            });

        case "portfolio_generate":
            // Gemini for structured HTML generation
            const geminiModel = gemini.getGenerativeModel({
                model: "gemini-2.5-flash-lite",  // Cheaper, $0.40/MTok output [citation:4]
                generationConfig: { responseMimeType: "application/json" }
            });
            return await geminiModel.generateContent(input);

        default:
            // Fallback to Groq
            return await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: input }],
            });
    }
}