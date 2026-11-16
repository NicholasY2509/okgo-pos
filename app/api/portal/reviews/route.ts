import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  portalReviewsQuerySchema,
  portalSubmitReviewSchema,
} from "@/modules/service-session/schemas/review-session"
import { ServiceSessionService } from "@/modules/service-session/services/service-session-service"

export async function GET(req: NextRequest) {
  const branchIdParam = req.nextUrl.searchParams.get("branchId") ?? ""

  const validatedQuery = portalReviewsQuerySchema.safeParse({
    branchId: branchIdParam,
  })

  if (!validatedQuery.success) {
    const firstError = validatedQuery.error.issues[0]?.message
    return NextResponse.json(
      { error: firstError || "Parameter cabang tidak valid." },
      { status: 400 }
    )
  }

  try {
    const sessions = await ServiceSessionService.getDailyReviewableSessions(
      validatedQuery.data.branchId
    )

    return NextResponse.json(
      {
        success: true,
        data: sessions.map((session) => ({
          id: session.id,
          customerName:
            session.transactionItem?.transaction?.customer?.name ||
            "Pelanggan Umum",
          itemName: session.transactionItem?.itemNameSnapshot || "Layanan",
          staffName: session.staff?.firstName || null,
          staffImageUrl: session.staff?.imageUrl || null,
          actualEndTime: session.actualEndTime
            ? session.actualEndTime.toISOString()
            : null,
        })),
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memuat daftar ulasan sesi."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = portalSubmitReviewSchema.safeParse(body)

    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message
      return NextResponse.json(
        { error: firstError || "Data ulasan tidak valid." },
        { status: 400 }
      )
    }

    const { sessionId, branchId, rating, comment } = validated.data

    const session = await prisma.serviceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        branchId: true,
        status: true,
        rating: true,
      },
    })

    if (!session || session.branchId !== branchId) {
      return NextResponse.json(
        { error: "Sesi layanan tidak ditemukan pada cabang ini." },
        { status: 404 }
      )
    }

    if (session.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Ulasan hanya dapat diberikan untuk sesi yang telah selesai." },
        { status: 400 }
      )
    }

    if (session.rating !== null) {
      return NextResponse.json(
        { error: "Sesi layanan ini sudah memiliki ulasan." },
        { status: 409 }
      )
    }

    const updated = await ServiceSessionService.submitReview(
      sessionId,
      rating,
      comment && comment.length > 0 ? comment : undefined
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updated.id,
          rating: updated.rating,
          reviewComment: updated.reviewComment,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal menyimpan ulasan."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
