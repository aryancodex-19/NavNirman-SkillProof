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
      return NextResponse.json([]);
    }

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
    console.error("Error listing resumes:", error);
    return NextResponse.json({ error: error.message || "Failed to list resumes" }, { status: 500 });
  }
}
