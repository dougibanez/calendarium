import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureUserColor } from "@/lib/userColors"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json(null)

  const color = await ensureUserColor(session.user.id, prisma)

  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    color,
  })
}
