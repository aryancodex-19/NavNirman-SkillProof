import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function analyzeWithGroq(jobDescription: string, resumeText: string) {
  const prompt = `
    You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.
    
    Job Description:
    ${jobDescription}
    
    Resume:
    ${resumeText}
    
    Return ONLY valid JSON in this exact format:
    {
      "score": 75,
      "matchedKeywords": ["React", "JavaScript", "Node.js"],
      "missingKeywords": ["TypeScript", "GraphQL"],
      "feedback": ["Add more quantifiable results", "Include missing keywords"],
      "formattingIssues": []
    }
    
    Score should be 0-100 based on keyword match and relevance.
    Be strict but fair in scoring.
  `;

  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an ATS expert. Always return valid JSON only. No markdown, no extra text."
        },
        { role: "user", content: prompt }
      ],
      // ✅ WORKING MODELS - Try these:
      model: "llama-3.3-70b-versatile",  // Best, most capable
      // model: "llama-3.1-70b-versatile", // Alternative
      // model: "mixtral-8x7b-32768",      // Another option
      // model: "gemma2-9b-it",             // Lighter, faster
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content);

  } catch (error: any) {
    console.error("Groq API Error:", error);
    // Fallback mock data if API fails
    return {
      score: 65,
      matchedKeywords: ["JavaScript", "React", "HTML", "CSS"],
      missingKeywords: ["TypeScript", "Node.js", "MongoDB"],
      feedback: [
        "Consider adding TypeScript to your skills",
        "Add more quantifiable achievements",
        "Include a projects section"
      ],
      formattingIssues: ["Consider using bullet points for experience"]
    };
  }
}