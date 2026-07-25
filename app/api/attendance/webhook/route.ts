import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const headers = Object.fromEntries(req.headers);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);

    // Attempt to parse JSON body, fallback to text
    let body;
    const rawBody = await req.text();
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      body = rawBody; // If not JSON, keep as raw text
    }

    console.log("=========================================");
    console.log("FINGERPRINT MACHINE ATTENDANCE PAYLOAD RECEIVED");
    console.log("=========================================");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Method: POST");
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Query Params:", JSON.stringify(searchParams, null, 2));
    console.log("Body:", typeof body === 'object' ? JSON.stringify(body, null, 2) : body);
    console.log("=========================================");

    return NextResponse.json({ success: true, message: "Attendance data received" });
  } catch (error) {
    console.error("Error processing attendance webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const headers = Object.fromEntries(req.headers);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);

    console.log("=========================================");
    console.log("FINGERPRINT MACHINE ATTENDANCE PAYLOAD RECEIVED (GET)");
    console.log("=========================================");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Method: GET");
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("Query Params:", JSON.stringify(searchParams, null, 2));
    console.log("=========================================");

    return NextResponse.json({ success: true, message: "Attendance data received" });
  } catch (error) {
    console.error("Error processing attendance webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
