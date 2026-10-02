import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Helper to generate text content using Gemini 2.0 Flash
 */
export async function generateContent(prompt: string, systemInstruction?: string) {
  if (!genAI) {
    throw new Error("Gemini AI is not initialized. Please set GEMINI_API_KEY in your env file.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",  // ✅ Updated to Gemini 2.0 Flash
    systemInstruction,
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Helper to generate content from parts (e.g. text + files/base64 blobs)
 */
export async function generateContentFromParts(
  parts: any[],
  systemInstruction?: string,
  responseMimeType?: string
) {
  if (!genAI) {
    throw new Error("Gemini AI is not initialized. Please set GEMINI_API_KEY in your env file.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",  // ✅ Updated to Gemini 2.0 Flash
    systemInstruction,
    generationConfig: responseMimeType ? { responseMimeType } : undefined,
  });

  const result = await model.generateContent(parts);
  return result.response.text();
}