import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const db = prisma as any;
    
    const [totalUsers, totalResumes, totalAtsScans, interviewSessionsCount, voiceInterviewsCount] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.aTSScan.count(),
      prisma.interviewSession.count(),
      prisma.voiceInterview.count(),
    ]);

    // Average ATS Score
    const avgAtsAggregate = await prisma.aTSScan.aggregate({
      _avg: { score: true },
    });
    const avgAtsScore = avgAtsAggregate._avg.score ? Math.round(avgAtsAggregate._avg.score) : 0;

    // Coding progress max streak (global or average)
    const codingProgress = await prisma.codingProgress.aggregate({
      _max: { streak: true },
    });
    const maxCodingStreak = codingProgress._max.streak || 0;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalResumes: totalResumes || 0,
      totalAtsScans: totalAtsScans || 0,
      totalInterviews: (interviewSessionsCount || 0) + (voiceInterviewsCount || 0),
      avgAtsScore,
      maxCodingStreak,
    });
  } catch (error: any) {
    console.error("API stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load database stats" },
      { status: 500 }
    );
  }
}
