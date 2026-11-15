import { SessionSegmentRepository } from "../repositories/session-segment-repository";
import type {
  AddContinuationSegmentInput,
  StartSegmentInput,
  SwitchActiveSegmentInput,
  UpdateScheduledSegmentInput,
} from "../schemas/session-segment-schema";

function calculateCommissionFromRules(staff: any, unitPrice: number): number {
  const rules = staff?.workPosition?.incentiveRules || [];
  const matchingRules = rules
    .filter((rule: any) => rule.targetStaffLevel === null || rule.targetStaffLevel === staff.level)
    .sort((a: any, b: any) => {
      if (a.targetStaffLevel && !b.targetStaffLevel) return -1;
      if (!a.targetStaffLevel && b.targetStaffLevel) return 1;
      return 0;
    });

  for (const rule of matchingRules) {
    if (rule.ruleType === "SERVICE_PRICE_PERCENTAGE" && rule.flatPercentage) {
      return (Number(rule.flatPercentage) / 100) * unitPrice;
    }
    if (rule.ruleType === "FIXED_AMOUNT" && rule.flatAmount) {
      return Number(rule.flatAmount);
    }
  }
  return 0;
}

export class SessionSegmentService {
  static async addContinuationSegment(input: AddContinuationSegmentInput) {
    const session = await SessionSegmentRepository.getSessionWithSegments(input.sessionId);
    if (!session) throw new Error("Sesi tidak ditemukan.");
    if (session.status !== "SCHEDULED" && session.status !== "IN_PROGRESS") {
      throw new Error("Hanya sesi terjadwal atau berlangsung yang dapat dilanjutkan.");
    }

    const { product, staff, room } = await SessionSegmentRepository.getServiceAndStaff(
      input.serviceId,
      input.staffId,
      input.roomId
    );
    if (!product || !product.isActive) throw new Error("Layanan tidak valid.");
    if (!staff || !staff.isActive) throw new Error("Terapis tidak valid.");
    if (input.roomId && (!room || !room.isActive || room.branchId !== session.branchId)) {
      throw new Error("Ruangan tujuan tidak valid.");
    }

    const durationMinutes = input.durationMinutes || product.duration || 60;
    const lastSegment = session.segments[session.segments.length - 1];
    const nextSequence = lastSegment ? lastSegment.sequenceOrder + 1 : 1;

    const startTime = lastSegment?.endTime || session.endTime || new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const unitPrice = Number(product.price);
    const commissionAmount = calculateCommissionFromRules(staff, unitPrice);
    const tx = session.transactionItem?.transaction;

    return await SessionSegmentRepository.addContinuationSegment({
      sessionId: session.id,
      serviceId: product.id,
      staffId: staff.id,
      roomId: input.roomId || lastSegment?.roomId || session.roomId,
      productName: product.name,
      unitPrice,
      durationMinutes,
      sequenceOrder: nextSequence,
      startTime,
      endTime,
      commissionAmount,
      transactionId: tx?.id || null,
      transactionStatus: tx?.status || null,
      transactionPaidAmount: tx?.paidAmount ? Number(tx.paidAmount) : 0,
      transactionSubtotal: tx?.subtotal ? Number(tx.subtotal) : 0,
      transactionTotalAmount: tx?.totalAmount ? Number(tx.totalAmount) : 0,
    });
  }

  static async switchActiveSegment(input: SwitchActiveSegmentInput) {
    const session = await SessionSegmentRepository.getSessionWithSegments(input.sessionId);
    if (!session) throw new Error("Sesi tidak ditemukan.");
    if (session.status !== "IN_PROGRESS") {
      throw new Error("Ganti servis hanya dapat dilakukan saat sesi sedang berlangsung.");
    }

    const { product, staff, room } = await SessionSegmentRepository.getServiceAndStaff(
      input.serviceId,
      input.staffId,
      input.roomId
    );
    if (!product || !product.isActive) throw new Error("Layanan pengganti tidak valid.");
    if (!staff || !staff.isActive) throw new Error("Terapis tidak valid.");
    if (input.roomId && (!room || !room.isActive || room.branchId !== session.branchId)) {
      throw new Error("Ruangan tujuan tidak valid.");
    }

    const activeSegment =
      session.segments.find((s) => s.status === "IN_PROGRESS") ||
      session.segments[session.segments.length - 1];

    if (!activeSegment) {
      throw new Error("Segmen aktif tidak ditemukan.");
    }

    const now = new Date();
    const originalEndTime = activeSegment.endTime || session.endTime;
    const remainingMs = originalEndTime ? originalEndTime.getTime() - now.getTime() : 0;
    const remainingMinutes =
      remainingMs > 60000
        ? Math.max(1, Math.round(remainingMs / 60000))
        : product.duration || 60;

    const newEndTime =
      originalEndTime && originalEndTime.getTime() > now.getTime()
        ? originalEndTime
        : new Date(now.getTime() + remainingMinutes * 60000);

    const maxSeq = session.segments.reduce(
      (max, s) => (s.sequenceOrder > max ? s.sequenceOrder : max),
      0
    );

    return await SessionSegmentRepository.switchActiveSegment({
      sessionId: session.id,
      activeSegmentId: activeSegment.id,
      newSequenceOrder: maxSeq + 1,
      newServiceId: product.id,
      newStaffId: staff.id,
      newRoomId: input.roomId || activeSegment.roomId || session.roomId,
      isSameStaff: activeSegment.staffId === staff.id,
      remainingMinutes,
      now,
      newEndTime,
      transactionItemId: activeSegment.transactionItemId || session.transactionItemId,
    });
  }

  static async startSegment(input: StartSegmentInput) {
    const session = await SessionSegmentRepository.getSessionWithSegments(input.sessionId);
    if (!session) throw new Error("Sesi tidak ditemukan.");

    const target = session.segments.find((s) => s.id === input.segmentId);
    if (!target) throw new Error("Segmen tidak ditemukan.");
    if (target.status !== "SCHEDULED") {
      throw new Error("Segmen tidak dalam status terjadwal.");
    }
    if (!target.staffId) {
      throw new Error("Terapis segmen belum dipilih.");
    }

    return await SessionSegmentRepository.startSegment({
      sessionId: session.id,
      segmentId: target.id,
      serviceId: target.serviceId,
      staffId: target.staffId,
      roomId: target.roomId,
      now: new Date(),
    });
  }

  static async updateScheduledSegment(input: UpdateScheduledSegmentInput) {
    const session = await SessionSegmentRepository.getSessionWithSegments(input.sessionId);
    if (!session) throw new Error("Sesi tidak ditemukan.");

    const targetIndex = session.segments.findIndex((s) => s.id === input.segmentId);
    if (targetIndex === -1) throw new Error("Segmen tidak ditemukan.");

    const target = session.segments[targetIndex];
    if (target.status !== "SCHEDULED") {
      throw new Error("Hanya segmen yang belum dimulai yang dapat diedit.");
    }

    const { product, staff, room } = await SessionSegmentRepository.getServiceAndStaff(
      input.serviceId,
      input.staffId,
      input.roomId
    );
    if (!product) throw new Error("Layanan tidak ditemukan.");
    if (!staff) throw new Error("Terapis tidak ditemukan.");
    if (!room) throw new Error("Ruangan tidak ditemukan.");
    if (room.branchId !== session.branchId) {
      throw new Error("Ruangan tidak sesuai dengan cabang sesi.");
    }
    if (session.isVip && !room.isVip) {
      throw new Error("Sesi VIP hanya dapat menggunakan ruangan VIP.");
    }

    const durationMinutes = product.duration || 60;
    const prevSeg = targetIndex > 0 ? session.segments[targetIndex - 1] : null;
    const startTime = target.startTime || prevSeg?.endTime || session.startTime || new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const subsequentSegments: Array<{ id: string; startTime: Date; endTime: Date }> = [];
    let cursorEnd = endTime;
    for (let i = targetIndex + 1; i < session.segments.length; i++) {
      const nextSeg = session.segments[i];
      if (nextSeg.status !== "SCHEDULED") break;
      const nextStart = new Date(cursorEnd);
      const nextEnd = new Date(nextStart.getTime() + (nextSeg.durationMinutes || 60) * 60000);
      subsequentSegments.push({ id: nextSeg.id, startTime: nextStart, endTime: nextEnd });
      cursorEnd = nextEnd;
    }

    const sessionEndTime =
      subsequentSegments.length > 0
        ? subsequentSegments[subsequentSegments.length - 1].endTime
        : targetIndex === session.segments.length - 1
          ? endTime
          : session.endTime || endTime;

    return await SessionSegmentRepository.updateScheduledSegment({
      sessionId: session.id,
      segmentId: target.id,
      serviceId: product.id,
      staffId: staff.id,
      roomId: room.id,
      durationMinutes,
      startTime,
      endTime,
      subsequentSegments,
      sessionEndTime,
      updateSessionSummary: targetIndex === 0,
    });
  }
}
