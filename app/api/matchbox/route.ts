import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const cars = await prisma.matchboxCar.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cars)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const { name, year, series, color, condition, imageUrl, notes, price, acquiredAt } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
  }

  const car = await prisma.matchboxCar.create({
    data: {
      name: name.trim(),
      year: year ? parseInt(year) : null,
      series: series?.trim() || null,
      color: color?.trim() || null,
      condition: condition || "Good",
      imageUrl: imageUrl?.trim() || null,
      notes: notes?.trim() || null,
      price: price ? parseFloat(price) : null,
      acquiredAt: acquiredAt ? new Date(acquiredAt) : null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(car, { status: 201 })
}
