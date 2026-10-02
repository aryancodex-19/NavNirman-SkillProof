import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { username, token } = body as { username: string; token?: string };

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return Response.json({ error: "GitHub username is required" }, { status: 400 });
    }

    const cleanUsername = username.trim().replace(/^@/, "");

    // Validate that the GitHub user exists
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CareerOS-App",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const ghRes = await fetch(`https://api.github.com/users/${cleanUsername}`, { headers });

    if (!ghRes.ok) {
      if (ghRes.status === 404) {
        return Response.json({ error: "GitHub user not found. Please check the username." }, { status: 404 });
      }
      return Response.json({ error: "Failed to validate GitHub username" }, { status: 502 });
    }

    const ghUser = await ghRes.json();

    // Upsert the GitHubAnalysis record
    const db = prisma as any;
    const analysis = await db.gitHubAnalysis.upsert({
      where: { userId: user.id },
      update: {
        githubUsername: cleanUsername,
        githubToken: token || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        githubUsername: cleanUsername,
        githubToken: token || null,
        analysisData: {},
        overallScore: 0,
      },
    });

    return Response.json({
      success: true,
      username: cleanUsername,
      avatarUrl: ghUser.avatar_url,
      profileUrl: ghUser.html_url,
      name: ghUser.name,
      bio: ghUser.bio,
      publicRepos: ghUser.public_repos,
      followers: ghUser.followers,
      following: ghUser.following,
      id: analysis.id,
    });
  } catch (error: any) {
    console.error("GitHub connect error:", error);
    return Response.json(
      { error: error.message || "Failed to connect GitHub" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const db = prisma as any;
    await db.gitHubAnalysis.deleteMany({ where: { userId: user.id } });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("GitHub disconnect error:", error);
    return Response.json(
      { error: error.message || "Failed to disconnect GitHub" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return Response.json(null);
    }

    const db = prisma as any;
    const analysis = await db.gitHubAnalysis.findUnique({
      where: { userId: user.id },
    });

    if (!analysis) {
      return Response.json(null);
    }

    return Response.json({
      id: analysis.id,
      username: analysis.githubUsername,
      overallScore: analysis.overallScore,
      analysisData: analysis.analysisData || {},
      analyzedAt: analysis.analyzedAt,
      hasToken: !!analysis.githubToken,
    });
  } catch (error: any) {
    console.error("GitHub get status error:", error);
    return Response.json(
      { error: error.message || "Failed to get GitHub status" },
      { status: 500 }
    );
  }
}
