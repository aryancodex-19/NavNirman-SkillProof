"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: {
  name: string;
  targetRole: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress || "";

  await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      name: formData.name,
      targetRole: formData.targetRole,
      skills: JSON.stringify(formData.skills),
      githubUrl: formData.githubUrl,
      linkedinUrl: formData.linkedinUrl,
      bio: formData.bio,
      email,
    },
    create: {
      clerkId: userId,
      name: formData.name,
      email,
      targetRole: formData.targetRole,
      skills: JSON.stringify(formData.skills),
      githubUrl: formData.githubUrl,
      linkedinUrl: formData.linkedinUrl,
      bio: formData.bio,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
