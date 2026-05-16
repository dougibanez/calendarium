import type { PrismaClient } from "@prisma/client"

export const USER_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
]

/**
 * Returns the color assigned to a user, assigning a unique one if they don't have one yet.
 * Guarantees no two users share the same color (up to USER_COLORS.length users).
 */
export async function ensureUserColor(
  userId: string,
  prisma: PrismaClient
): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { color: true },
  })

  if (user?.color) return user.color

  const taken = new Set(
    (
      await prisma.user.findMany({
        where: { id: { not: userId }, color: { not: null } },
        select: { color: true },
      })
    ).map((u) => u.color!)
  )

  const color =
    USER_COLORS.find((c) => !taken.has(c)) ??
    USER_COLORS[taken.size % USER_COLORS.length]

  await prisma.user.update({ where: { id: userId }, data: { color } })

  return color
}
