import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const existing = await prisma.matchboxCar.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const body = await request.json()
  const { name, year, series, color, condition, imageUrl, notes, price, acquiredAt } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
  }

  const car = await prisma.matchboxCar.update({
    where: { id: params.id },
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
    },
  })

  return NextResponse.json(car)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const existing = await prisma.matchboxCar.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.matchboxCar.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
