import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find local user
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId,
          email: "placeholder@email.com",
          name: "User",
        },
      });
    }

    const {
      id,
      title,
      fullName,
      email,
      phone,
      summary,
      skills,
      experience,
      education,
      atsScore,
      targetRole,
    } = await req.json();

    // Normalize experience items to make sure bullets/achievements are consistent
    let normalizedExperience = experience;
    if (Array.isArray(experience)) {
      normalizedExperience = experience.map((exp: any) => ({
        company: exp.company || "",
        role: exp.role || "",
        duration: exp.duration || "",
        bullets: exp.bullets || exp.achievements || [""],
      }));
    }

    const dataPayload = {
      title: title || "Untitled Resume",
      fullName,
      email,
      phone,
      summary,
      skills: skills ? JSON.stringify(skills) : null,
      experience: normalizedExperience ? JSON.stringify(normalizedExperience) : null,
      education: education ? JSON.stringify(education) : null,
      atsScore: typeof atsScore === "number" ? atsScore : null,
      targetRole,
    };

    let savedResume;

    if (id) {
      // Verify owner
      const existing = await prisma.resume.findFirst({
        where: { id, userId: user.id },
      });

      if (!existing) {
        return NextResponse.json({ error: "Resume not found or unauthorized" }, { status: 404 });
      }

      savedResume = await prisma.resume.update({
        where: { id },
        data: dataPayload,
      });
    } else {
      savedResume = await prisma.resume.create({
        data: {
          ...dataPayload,
          userId: user.id,
        },
      });
    }

    // Save a history version
    try {
      const lastVersion = await (prisma as any).resumeVersion.findFirst({
        where: { resumeId: savedResume.id },
        orderBy: { version: "desc" },
      });
      const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

      await (prisma as any).resumeVersion.create({
        data: {
          resumeId: savedResume.id,
          version: nextVersion,
          title: savedResume.title,
          fullName: savedResume.fullName,
          email: savedResume.email,
          phone: savedResume.phone,
          summary: savedResume.summary,
          skills: savedResume.skills,
          experience: savedResume.experience,
          education: savedResume.education,
          atsScore: savedResume.atsScore,
          targetRole: savedResume.targetRole,
        },
      });
    } catch (versionErr) {
      console.error("Failed to create resume version:", versionErr);
    }

    return NextResponse.json(savedResume);
  } catch (error: any) {
    console.error("Error saving resume:", error);
    return NextResponse.json({ error: error.message || "Failed to save resume" }, { status: 500 });
  }
}

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
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const resume = await prisma.resume.findFirst({
        where: { id, userId: user.id },
      });

      if (!resume) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }

      return NextResponse.json(resume);
    }

    // List all
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        fullName: true,
        targetRole: true,
        atsScore: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(resumes);
  } catch (error: any) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch resumes" }, { status: 500 });
  }
}
