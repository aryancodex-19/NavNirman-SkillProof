import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(null);
    }

    const latestResume = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!latestResume) {
      return NextResponse.json(null);
    }

    // Parse JSON string fields back to arrays/objects
    let skills = [];
    let experience = [];
    let education = [];

    try {
      if (latestResume.skills) {
        skills = JSON.parse(latestResume.skills);
      }
    } catch (e) {
      console.error("Failed to parse skills:", e);
    }

    try {
      if (latestResume.experience) {
        experience = JSON.parse(latestResume.experience);
      }
    } catch (e) {
      console.error("Failed to parse experience:", e);
    }

    try {
      if (latestResume.education) {
        education = JSON.parse(latestResume.education);
      }
    } catch (e) {
      console.error("Failed to parse education:", e);
    }

    return NextResponse.json({
      ...latestResume,
      skills,
      experience,
      education,
    });
  } catch (error: any) {
    console.error("Error fetching latest resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resume" },
      { status: 500 }
    );
  }
}
