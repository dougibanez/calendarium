import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserColor } from "@/lib/userColors"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  const events = await prisma.event.findMany({
    where: {
      startDate: {
        gte: start ? new Date(start) : undefined,
        lte: end ? new Date(end) : undefined,
      },
    },
    include: {
      user: {
        select: { id: true, name: true, image: true, email: true },
      },
    },
    orderBy: { startDate: "asc" },
  })

  return NextResponse.json(events)
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

  const color = getUserColor(session.user.id)

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
