import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AttendanceService } from "@/modules/attendance/services/attendance-service";

const ATTENDANCE_STATES: Record<number, string> = {
  0: "Tidak Dikenal",
  1: "Masuk",
  2: "Mulai Istirahat",
  3: "Selesai Istirahat",
  4: "Pulang",
  5: "Mulai Lembur",
  6: "Selesai Lembur"
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

    if (parsedData) {
      // Jika ini adalah event akses masuk (AccessControl)
      if (parsedData.Events && parsedData.Events.length > 0) {
        const eventData = parsedData.Events[0].Data;
        const attendanceState = eventData.AttendanceState || 0;
        const punchType = ATTENDANCE_STATES[attendanceState] || `Tidak Diketahui (${attendanceState})`;

        // Simpan ke database
        try {
          // Konversi string UTCTime (2026-07-26 13:57:56) ke Date Object
          const parsedTime = eventData.UTCTime ? new Date(eventData.UTCTime.replace(" ", "T") + "Z") : null;

          const deviceSn = eventData.SN || "";
          const machineUserId = String(eventData.UserID || "");
          let branchId = null;
          let staffId = null;

          if (deviceSn) {
            const machine = await prisma.attendanceMachine.findUnique({
              where: { sn: deviceSn }
            });
            if (machine) {
              branchId = machine.branchId;

              if (machineUserId) {
                const staffMachine = await prisma.staffMachine.findUnique({
                  where: {
                    machineId_machineUserId: {
                      machineId: machine.id,
                      machineUserId: machineUserId
                    }
                  }
                });
                if (staffMachine) {
                  staffId = staffMachine.staffId;
                }
              }
            }
          }

          const savedLog = await prisma.attendanceMachineLog.create({
            data: {
              machineUserId: machineUserId,
              cardName: eventData.CardName || "Unknown",
              attendanceState: attendanceState,
              punchType: punchType,
              deviceSn: deviceSn,
              branchId: branchId,
              staffId: staffId,
              similarity: eventData.Similarity ? Number(eventData.Similarity) : null,
              utcTime: parsedTime,
              rawPayload: JSON.stringify(parsedData)
            }
          });

          if (staffId && parsedTime) {
            // Find machine id for processing punch
            const machine = await prisma.attendanceMachine.findUnique({
              where: { sn: deviceSn }
            });
            if (machine) {
              await AttendanceService.processPunch(staffId, savedLog.createdAt, String(attendanceState), machine.id);
            }
          }
        } catch (dbError) {
          console.error("❌ GAGAL MENYIMPAN KE DATABASE:", dbError);
        }
      }
    }

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

    return NextResponse.json({ success: true, message: "Attendance data received" });
  } catch (error) {
    console.error("Error processing attendance webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
