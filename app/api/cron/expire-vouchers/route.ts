import { NextResponse } from "next/server";
import { VoucherExpirationService } from "@/modules/accounting/services/voucher-expiration-service";

// For Vercel Cron or custom Docker Cron
// e.g., hit /api/cron/expire-vouchers?secret=YOUR_SECRET_HERE

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify the secret against an environment variable (or hardcoded if env is not set yet)
  const EXPECTED_SECRET = process.env.CRON_SECRET || "super-secret-cron-key-123";

  if (secret !== EXPECTED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await VoucherExpirationService.processExpiredVouchers();
    
    return NextResponse.json({
      success: true,
      message: `Processed ${result.count} expired vouchers.`,
      recognizedValue: result.recognizedValue,
      warning: (result as any).warning
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing expired vouchers:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process expired vouchers"
    }, { status: 500 });
  }
}
