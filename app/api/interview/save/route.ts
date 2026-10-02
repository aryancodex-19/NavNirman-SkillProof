import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, questions, answers, scores } = await req.json();

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

    const session = await (prisma as any).interviewSession.create({
      data: {
        userId: user.id,
        role: role || "General",
        questions: Array.isArray(questions) ? JSON.stringify(questions) : JSON.stringify([]),
        answers: Array.isArray(answers) ? JSON.stringify(answers) : JSON.stringify([]),
        scores: Array.isArray(scores) ? JSON.stringify(scores) : JSON.stringify([]),
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("Error saving interview session:", error);
    return NextResponse.json({ error: error.message || "Failed to save session" }, { status: 500 });
  }
}
