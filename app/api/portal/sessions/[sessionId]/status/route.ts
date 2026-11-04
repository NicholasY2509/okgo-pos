import { NextRequest, NextResponse } from "next/server"
import { portalSessionActionSchema } from "@/modules/room/schemas/room-schema"
import { TimetableService } from "@/modules/pos/services/timetable-service"
import { prisma } from "@/lib/prisma"
import { broadcastSocketEvent } from "@/lib/socket-broadcast"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const resolvedParams = await context.params
  const sessionId = (resolvedParams.sessionId ?? "").trim()

  if (!sessionId) {
    return NextResponse.json(
      { error: "ID sesi layanan wajib diisi." },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const validated = portalSessionActionSchema.safeParse(body)

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message
      return NextResponse.json(
        { error: firstError || "Payload tidak valid." },
        { status: 400 }
      )
    }

    const { branchId, action, staffId } = validated.data

    // Verify session existence and branch match
    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      include: {
        staff: true,
      },
    })

    if (!session || session.branchId !== branchId) {
      return NextResponse.json(
        { error: "Sesi layanan tidak ditemukan pada cabang ini." },
        { status: 404 }
      )
    }

    // Verify that the assigned therapist matches or update session staff if unassigned
    if (session.staffId && session.staffId !== staffId) {
      return NextResponse.json(
        {
          error:
            "Terapis yang terverifikasi tidak cocok dengan terapis yang ditugaskan pada sesi ini.",
        },
        { status: 403 }
      )
    }

    if (!session.staffId) {
      await TimetableService.updateSessionStaff(sessionId, staffId)
    }

    if (action === "START") {
      await TimetableService.startSession(sessionId)
    } else if (action === "COMPLETE") {
      await TimetableService.completeSession(sessionId)
    }

    const updated = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        actualStartTime: true,
        actualEndTime: true,
        roomId: true,
        branchId: true,
      },
    })

    // Broadcast real-time WebSocket update to room tablet, branch, and POS clients
    await broadcastSocketEvent("service_status_changed", {
      sessionId,
      branchId,
      roomId: session.roomId,
      action: action.toLowerCase(),
      staffId,
      status: updated?.status,
    })

    return NextResponse.json(
      {
        success: true,
        data: updated,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memproses sesi layanan."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

