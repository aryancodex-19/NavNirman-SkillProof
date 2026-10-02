import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { analyzeWithGroq } from "@/lib/ai/groq";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    const { jobDescription, resumeText } = await req.json();

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: "Job description and resume text are required" },
        { status: 400 }
      );
    }

    const result = await analyzeWithGroq(jobDescription, resumeText);

    // Save to database if authenticated
    if (clerkId) {
      try {
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

        await (prisma as any).aTSScan.create({
          data: {
            userId: user.id,
            jobDescription,
            resumeText,
            score: result.score || 0,
            matchedSkills: JSON.stringify(result.matchedKeywords || []),
            missingSkills: JSON.stringify(result.missingKeywords || []),
            feedback: JSON.stringify(result.feedback || []),
            formatting: JSON.stringify(result.formattingIssues || []),
          },
        });
      } catch (dbError) {
        console.error("Failed to save ATS Scan to database:", dbError);
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("ATS Scan Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan resume" },
      { status: 500 }
    );
  }
}