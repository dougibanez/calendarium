import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
  })

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 })
  }

  if (event.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Solo puedes eliminar tus propios eventos" },
      { status: 403 }
    )
  }

  await prisma.event.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
