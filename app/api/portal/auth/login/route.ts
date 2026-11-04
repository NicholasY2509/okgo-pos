import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/modules/auth/schemas/login"
import { AuthService } from "@/modules/auth/services/auth-service"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 }
    )
  }

  const validatedFields = loginSchema.safeParse(body)
  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0]?.message
    return NextResponse.json(
      {
        error:
          firstError || "Data formulir tidak valid. Harap periksa input Anda.",
      },
      { status: 400 }
    )
  }

  const { email, password, subdomain } = validatedFields.data

  try {
    const user = await AuthService.verifyCredentials(email, password, subdomain)

    if (!user.branch) {
      return NextResponse.json(
        { error: "Akun ini belum ditugaskan ke cabang mana pun." },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name ?? user.email,
          email: user.email,
          role: user.role.name,
          branch: {
            id: user.branch.id,
            name: user.branch.name,
            subdomain: user.branch.subdomain,
          },
          authenticatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Email atau kata sandi tidak valid."

    return NextResponse.json({ error: message }, { status: 401 })
  }
}
