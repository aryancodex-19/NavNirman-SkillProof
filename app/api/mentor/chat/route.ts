import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ messages: [] });

    const chats = await (prisma as any).mentorChat.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const messages = chats.map((c: any) => ({
      id: c.id,
      role: c.sender === "mentor" ? "assistant" : "user",
      content: c.message,
      timestamp: c.createdAt,
    }));

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error("Mentor chat fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: "placeholder@email.com",
          name: "User",
        },
      });
    }

    // Save the latest user message to the database
    const latestUserMsg = messages[messages.length - 1];
    if (latestUserMsg && latestUserMsg.role === "user") {
      await (prisma as any).mentorChat.create({
        data: {
          userId: user.id,
          message: latestUserMsg.content,
          sender: "user",
        },
      });
    }

    const systemPrompt = `You are CareerOS AI Career Mentor — a world-class career coach specializing in helping students and early-career professionals land their dream jobs. 

${userProfile ? `User Profile:
- Name: ${userProfile.name || "Student"}
- Target Role: ${userProfile.targetRole || "Not specified"}
- Skills: ${userProfile.skills || "Not specified"}` : ""}

Your expertise includes:
- Personalized career roadmaps tailored to the user's goals and current skill level
- Course recommendations from top platforms (Coursera, Udemy, YouTube, etc.)
- Project ideas that make a real impact on resumes
- Industry insights and job market trends
- LinkedIn and networking strategies
- Interview preparation tactics
- Resume and portfolio advice

Guidelines:
- Be warm, encouraging, and highly specific — avoid generic advice
- Use bullet points and structure for clarity
- When suggesting courses, name them specifically (e.g., "CS50 on edX", "The Web Developer Bootcamp on Udemy")
- When suggesting projects, give concrete ideas with tech stacks
- Keep responses concise but complete — aim for 200-400 words
- Always end with a follow-up question to keep the conversation going`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) throw new Error("Empty response from Groq");

    // Save the mentor's reply to the database
    await (prisma as any).mentorChat.create({
      data: {
        userId: user.id,
        message: reply,
        sender: "mentor",
      },
    });

    return NextResponse.json({ message: reply });
  } catch (error: any) {
    console.error("Mentor chat error:", error);
    return NextResponse.json({ error: error.message || "Failed to get mentor response" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ success: true });

    await (prisma as any).mentorChat.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
