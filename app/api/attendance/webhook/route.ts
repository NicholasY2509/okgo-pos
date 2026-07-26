import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ATTENDANCE_STATES: Record<number, string> = {
  0: "Masuk",
  1: "Pulang",
  2: "Selesai Istirahat",
  3: "Mulai Istirahat",
  4: "Mulai Lembur",
  5: "Selesai Lembur"
};

export async function POST(req: NextRequest) {
  try {
    const headers = Object.fromEntries(req.headers);
    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const contentType = req.headers.get("content-type") || "";

    let parsedData: any = null;
    let isMultipart = contentType.includes("multipart/");

    if (isMultipart) {
      // Mesin mengirim multipart (JSON + Foto biner)
      const arrayBuffer = await req.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const rawString = buffer.toString("utf-8");

      // Cari batasan (boundary) dari Content-Type
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      const boundary = boundaryMatch ? boundaryMatch[1] : "myboundary";

      // Ekstrak blok teks JSON (berada di antara header multipart dan boundary berikutnya)
      const jsonStartIndex = rawString.indexOf("{");
      const nextBoundaryIndex = rawString.indexOf(`--${boundary}`, jsonStartIndex);

      if (jsonStartIndex !== -1 && nextBoundaryIndex !== -1) {
        const jsonString = rawString.substring(jsonStartIndex, nextBoundaryIndex).trim();
        try {
          parsedData = JSON.parse(jsonString);
        } catch (error) {
          console.error("Gagal melakukan parse JSON dari multipart:", error);
        }
      } else {
         console.log("JSON block tidak ditemukan dalam payload multipart.");
      }
    } else {
      // Payload JSON murni (seperti event DoorStatus)
      try {
        const rawBody = await req.text();
        parsedData = JSON.parse(rawBody);
      } catch (e) {
        console.error("Gagal melakukan parse payload JSON murni.");
      }
    }

    console.log("=========================================");
    console.log("FINGERPRINT MACHINE ATTENDANCE PAYLOAD RECEIVED");
    console.log("=========================================");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Method: POST");
    console.log("Type:", isMultipart ? "Multipart (With Image)" : "JSON");
    
    if (parsedData) {
      // Jika ini adalah event akses masuk (AccessControl)
      if (parsedData.Events && parsedData.Events.length > 0) {
        const eventData = parsedData.Events[0].Data;
        const attendanceState = eventData.AttendanceState || 0;
        const punchType = ATTENDANCE_STATES[attendanceState] || `Tidak Diketahui (${attendanceState})`;

        console.log(`👤 NAMA      : ${eventData.CardName || "Tidak Diketahui"}`);
        console.log(`🆔 USER ID   : ${eventData.UserID || "-"}`);
        console.log(`⏱️ WAKTU     : ${eventData.UTCTime || "-"}`);
        console.log(`✅ KECOCOKAN : ${eventData.Similarity || "-"}%`);
        console.log(`📋 STATUS    : ${punchType}`);

        // Simpan ke database
        try {
          // Konversi string UTCTime (2026-07-26 13:57:56) ke Date Object
          const parsedTime = eventData.UTCTime ? new Date(eventData.UTCTime.replace(" ", "T") + "Z") : null;
          
          await prisma.attendanceMachineLog.create({
            data: {
              machineUserId: String(eventData.UserID || ""),
              cardName: eventData.CardName || "Unknown",
              attendanceState: attendanceState,
              punchType: punchType,
              deviceSn: eventData.SN || "",
              similarity: eventData.Similarity ? Number(eventData.Similarity) : null,
              utcTime: parsedTime,
              rawPayload: JSON.stringify(parsedData)
            }
          });
          console.log("💾 BERHASIL DISIMPAN KE DATABASE!");
        } catch (dbError) {
          console.error("❌ GAGAL MENYIMPAN KE DATABASE:", dbError);
        }
      } else {
        // Event lain seperti DoorStatus
        console.log("Detail Event:", JSON.stringify(parsedData, null, 2));
      }
    } else {
      console.log("Body tidak dapat dibaca.");
    }
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
