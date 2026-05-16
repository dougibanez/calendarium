import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ensureUserColor } from "@/lib/userColors"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  const where =
    start && end
      ? {
          AND: [
            { startDate: { lte: new Date(end) } },
            {
              OR: [
                { endDate: { gte: new Date(start) } },
                {
                  AND: [
                    { endDate: null },
                    { startDate: { gte: new Date(start) } },
                  ],
                },
              ],
            },
          ],
        }
      : {}

  const events = await prisma.event.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, image: true, email: true, color: true },
      },
    },
    orderBy: { startDate: "asc" },
  })

  // Ensure every user in the results has a unique color assigned.
  // This also fixes existing users who ended up with the same color.
  const userMap = new Map(events.map((e) => [e.user.id, e.user]))
  const uniqueUsers = Array.from(userMap.values())
  const usersNeedingColor = uniqueUsers.filter((u) => !u.color)

  if (usersNeedingColor.length > 0) {
    const taken = new Set(
      uniqueUsers.map((u) => u.color).filter(Boolean) as string[]
    )
    for (const user of usersNeedingColor) {
      const color = await ensureUserColor(user.id, prisma)
      taken.add(color)
      user.color = color
    }
  }

  // user.color is the source of truth — override event.color in the response
  return NextResponse.json(
    events.map((e) => ({
      ...e,
      color: e.user.color ?? e.color,
      user: {
        id: e.user.id,
        name: e.user.name,
        image: e.user.image,
        email: e.user.email,
      },
    }))
  )
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, startDate, endDate, allDay } = body

  if (!title?.trim() || !startDate) {
    return NextResponse.json(
      { error: "El título y la fecha son obligatorios" },
      { status: 400 }
    )
  }

  // Assign a unique color to this user if they don't have one yet
  const color = await ensureUserColor(session.user.id, prisma)

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay || false,
      color,
      userId: session.user.id,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  })

  return NextResponse.json(event, { status: 201 })
}
