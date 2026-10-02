import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ hasResume: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ hasResume: false }, { status: 200 });
    }

    // Get the most recently updated resume
    const latestResume = await prisma.resume.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!latestResume) {
      return NextResponse.json({ hasResume: false }, { status: 200 });
    }

    // Build plain-text version from structured data
    let skills: string[] = [];
    let experience: any[] = [];
    let education: any[] = [];

    try {
      skills = latestResume.skills ? JSON.parse(latestResume.skills) : [];
    } catch {
      skills = [];
    }

    try {
      experience = latestResume.experience ? JSON.parse(latestResume.experience) : [];
    } catch {
      experience = [];
    }

    try {
      education = latestResume.education ? JSON.parse(latestResume.education) : [];
    } catch {
      education = [];
    }

    const sections: string[] = [];

    // Header
    if (latestResume.fullName) {
      sections.push(latestResume.fullName.toUpperCase());
    }

    const contactParts: string[] = [];
    if (latestResume.email) contactParts.push(latestResume.email);
    if (latestResume.phone) contactParts.push(latestResume.phone);
    if (contactParts.length > 0) {
      sections.push(contactParts.join(" | "));
    }

    if (latestResume.targetRole) {
      sections.push(latestResume.targetRole);
    }

    // Summary
    if (latestResume.summary) {
      sections.push("");
      sections.push("PROFESSIONAL SUMMARY");
      sections.push(latestResume.summary);
    }

    // Skills
    if (skills.length > 0) {
      sections.push("");
      sections.push("SKILLS");
      sections.push(skills.join(", "));
    }

    // Experience
    if (experience.length > 0) {
      sections.push("");
      sections.push("WORK EXPERIENCE");
      for (const exp of experience) {
        sections.push("");
        sections.push(`${exp.role || "Role"} at ${exp.company || "Company"} (${exp.duration || ""})`);
        if (Array.isArray(exp.bullets)) {
          for (const bullet of exp.bullets) {
            if (bullet) sections.push(`• ${bullet}`);
          }
        }
      }
    }

    // Education
    if (education.length > 0) {
      sections.push("");
      sections.push("EDUCATION");
      for (const edu of education) {
        const parts: string[] = [];
        if (edu.degree) parts.push(edu.degree);
        if (edu.school) parts.push(`from ${edu.school}`);
        if (edu.year) parts.push(`(${edu.year})`);
        if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
        sections.push(parts.join(" "));
      }
    }

    const resumeText = sections.join("\n").trim();

    return NextResponse.json({
      hasResume: true,
      resumeText,
      resumeTitle: latestResume.title || "Your Resume",
      resumeId: latestResume.id,
    });
  } catch (error: any) {
    console.error("Error fetching latest resume text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch resume", hasResume: false },
      { status: 500 }
    );
  }
}
