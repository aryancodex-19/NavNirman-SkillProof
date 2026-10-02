import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId, jobTitle, company, location, url, matchScore, save } = await req.json();
    if (!jobId) return NextResponse.json({ error: "Job ID is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (save) {
      const saved = await (prisma as any).savedJob.upsert({
        where: { userId_jobId: { userId: user.id, jobId } },
        create: {
          userId: user.id,
          jobId,
          jobTitle: jobTitle || "",
          company: company || "",
          location: location || "",
          url: url || "",
          matchScore: matchScore || 0,
        },
        update: {
          jobTitle: jobTitle || "",
          company: company || "",
          location: location || "",
          url: url || "",
          matchScore: matchScore || 0,
        },
      });
      return NextResponse.json({ success: true, saved });
    } else {
      await (prisma as any).savedJob.deleteMany({
        where: { userId: user.id, jobId },
      });
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Save internship error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
