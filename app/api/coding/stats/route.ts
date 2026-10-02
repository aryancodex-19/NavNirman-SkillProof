import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

const DSA_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stacks & Queues",
  "Trees", "Graphs", "Dynamic Programming", "Recursion",
  "Sorting", "Binary Search", "Hashing", "Heaps",
];

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ progress: [] });

    const dbProgress = await (prisma as any).codingProgress.findMany({ where: { userId: user.id } });
    const progressMap = new Map<string, any>(dbProgress.map((p: any) => [p.topic, p]));

    const progress = DSA_TOPICS.map(topic => {
      const existing = progressMap.get(topic);
      return {
        topic,
        problemsSolved: existing?.problemsSolved || 0,
        streak: existing?.streak || 0,
        lastActive: existing?.lastActive || null,
      };
    });

    return NextResponse.json({ progress });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { topic, increment } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await (prisma as any).codingProgress.findUnique({
      where: { userId_topic: { userId: user.id, topic } },
    });

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    if (existing?.lastActive) {
      const lastDate = new Date(existing.lastActive);
      const sameDay = lastDate.toDateString() === now.toDateString();
      const prevDay = lastDate.toDateString() === yesterday.toDateString();
      if (sameDay) newStreak = existing.streak;
      else if (prevDay) newStreak = existing.streak + 1;
    }

    const updated = await (prisma as any).codingProgress.upsert({
      where: { userId_topic: { userId: user.id, topic } },
      create: {
        userId: user.id,
        topic,
        problemsSolved: increment || 1,
        streak: newStreak,
        lastActive: now,
      },
      update: {
        problemsSolved: { increment: increment || 1 },
        streak: newStreak,
        lastActive: now,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Coding stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
