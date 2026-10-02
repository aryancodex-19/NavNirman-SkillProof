import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

/**
 *Safely resolves or creates the Prisma database User corresponding to the authenticated Clerk user.
 *
 *- Idempotent: Does not create duplicate user records.
 *- Non-intrusive: Does not perform writes on repeated reads if user already exists.
 *- Safe: Uses clerkId as the unique lookup key.
 */
export async function getOrCreateCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return null;
  }

  // Fast-path: check if user already exists in PostgreSQL
  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (existingUser) {
    return existingUser;
  }

  // First time seeing this authenticated user: fetch profile details from Clerk
  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    `${clerkId}@temporary.clerk.user`;

  const fullName =
    clerkUser?.fullName ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    "User";

  const profileImage = clerkUser?.imageUrl || null;

  // Safe upsert to handle any concurrent first-request races
  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      profileImage: profileImage || undefined,
    },
    create: {
      clerkId,
      email: primaryEmail,
      name: fullName,
      profileImage,
    },
  });

  return user;
}
