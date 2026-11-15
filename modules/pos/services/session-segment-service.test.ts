import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionSegmentService } from "./session-segment-service";
import { SessionSegmentRepository } from "../repositories/session-segment-repository";

vi.mock("../repositories/session-segment-repository", () => ({
  SessionSegmentRepository: {
    getSessionWithSegments: vi.fn(),
    getServiceAndStaff: vi.fn(),
    addContinuationSegment: vi.fn(),
    switchActiveSegment: vi.fn(),
    startSegment: vi.fn(),
    updateScheduledSegment: vi.fn(),
  },
}));

describe("SessionSegmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a continuation segment after the last segment", async () => {
    const end1 = new Date("2026-11-15T11:00:00.000Z");
    vi.mocked(SessionSegmentRepository.getSessionWithSegments).mockResolvedValueOnce({
      id: "sess-1",
      status: "IN_PROGRESS",
      endTime: end1,
      segments: [{ id: "seg-1", sequenceOrder: 1, endTime: end1, staffId: "staff-1" }],
      transactionItem: {
        transaction: {
          id: "tx-1",
          status: "COMPLETED",
          paidAmount: 100000,
          subtotal: 100000,
          totalAmount: 100000,
        },
      },
    } as any);

    vi.mocked(SessionSegmentRepository.getServiceAndStaff).mockResolvedValueOnce({
      product: { id: "srv-2", name: "Totok Wajah", price: 80000, duration: 30, isActive: true },
      staff: {
        id: "staff-1",
        isActive: true,
        level: "SENIOR",
        workPosition: {
          incentiveRules: [
            { ruleType: "SERVICE_PRICE_PERCENTAGE", flatPercentage: 10, targetStaffLevel: null },
          ],
        },
      },
    } as any);

    vi.mocked(SessionSegmentRepository.addContinuationSegment).mockResolvedValueOnce({
      id: "seg-2",
      sequenceOrder: 2,
    } as any);

    const res = await SessionSegmentService.addContinuationSegment({
      sessionId: "sess-1",
      serviceId: "srv-2",
      staffId: "staff-1",
    });

    expect(res).toEqual({ id: "seg-2", sequenceOrder: 2 });
    expect(SessionSegmentRepository.addContinuationSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-1",
        sequenceOrder: 2,
        durationMinutes: 30,
        commissionAmount: 8000,
        startTime: end1,
        endTime: new Date(end1.getTime() + 30 * 60000),
      })
    );
  });

  it("switches active segment with same therapist and starts new segment immediately", async () => {
    const futureEnd = new Date(Date.now() + 60 * 60000);
    vi.mocked(SessionSegmentRepository.getSessionWithSegments).mockResolvedValueOnce({
      id: "sess-1",
      status: "IN_PROGRESS",
      endTime: futureEnd,
      transactionItemId: "tx-item-1",
      segments: [
        {
          id: "seg-1",
          sequenceOrder: 1,
          status: "IN_PROGRESS",
          staffId: "staff-1",
          endTime: futureEnd,
          transactionItemId: "tx-item-1",
        },
      ],
    } as any);

    vi.mocked(SessionSegmentRepository.getServiceAndStaff).mockResolvedValueOnce({
      product: { id: "srv-2", name: "Reflexology", price: 150000, duration: 60, isActive: true },
      staff: { id: "staff-1", isActive: true },
    } as any);

    vi.mocked(SessionSegmentRepository.switchActiveSegment).mockResolvedValueOnce({
      id: "seg-2",
      status: "IN_PROGRESS",
    } as any);

    await SessionSegmentService.switchActiveSegment({
      sessionId: "sess-1",
      serviceId: "srv-2",
      staffId: "staff-1",
    });

    expect(SessionSegmentRepository.switchActiveSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-1",
        activeSegmentId: "seg-1",
        newSequenceOrder: 2,
        newServiceId: "srv-2",
        newStaffId: "staff-1",
        isSameStaff: true,
      })
    );
  });

  it("switches active segment with different therapist and leaves new segment scheduled", async () => {
    const futureEnd = new Date(Date.now() + 45 * 60000);
    vi.mocked(SessionSegmentRepository.getSessionWithSegments).mockResolvedValueOnce({
      id: "sess-1",
      status: "IN_PROGRESS",
      endTime: futureEnd,
      transactionItemId: "tx-item-1",
      segments: [
        {
          id: "seg-1",
          sequenceOrder: 1,
          status: "IN_PROGRESS",
          staffId: "staff-1",
          endTime: futureEnd,
          transactionItemId: "tx-item-1",
        },
      ],
    } as any);

    vi.mocked(SessionSegmentRepository.getServiceAndStaff).mockResolvedValueOnce({
      product: { id: "srv-2", name: "Reflexology", price: 150000, duration: 60, isActive: true },
      staff: { id: "staff-2", isActive: true },
    } as any);

    vi.mocked(SessionSegmentRepository.switchActiveSegment).mockResolvedValueOnce({
      id: "seg-2",
      status: "SCHEDULED",
    } as any);

    await SessionSegmentService.switchActiveSegment({
      sessionId: "sess-1",
      serviceId: "srv-2",
      staffId: "staff-2",
    });

    expect(SessionSegmentRepository.switchActiveSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        isSameStaff: false,
        newStaffId: "staff-2",
      })
    );
  });

  it("starts a scheduled segment", async () => {
    vi.mocked(SessionSegmentRepository.getSessionWithSegments).mockResolvedValueOnce({
      id: "sess-1",
      status: "IN_PROGRESS",
      segments: [
        { id: "seg-1", status: "COMPLETED", serviceId: "srv-1", staffId: "staff-1" },
        { id: "seg-2", status: "SCHEDULED", serviceId: "srv-2", staffId: "staff-2" },
      ],
    } as any);

    vi.mocked(SessionSegmentRepository.startSegment).mockResolvedValueOnce({
      id: "seg-2",
      status: "IN_PROGRESS",
    } as any);

    const res = await SessionSegmentService.startSegment({
      sessionId: "sess-1",
      segmentId: "seg-2",
    });

    expect(res).toEqual({ id: "seg-2", status: "IN_PROGRESS" });
  });

  it("updates a scheduled segment and cascades subsequent scheduled segments", async () => {
    const start1 = new Date("2026-11-15T10:00:00.000Z");
    const end1 = new Date("2026-11-15T11:00:00.000Z");
    const end2 = new Date("2026-11-15T12:00:00.000Z");

    vi.mocked(SessionSegmentRepository.getSessionWithSegments).mockResolvedValueOnce({
      id: "sess-1",
      branchId: "br-1",
      isVip: false,
      status: "SCHEDULED",
      startTime: start1,
      endTime: end2,
      segments: [
        { id: "seg-1", status: "SCHEDULED", startTime: start1, endTime: end1, durationMinutes: 60 },
        { id: "seg-2", status: "SCHEDULED", startTime: end1, endTime: end2, durationMinutes: 60 },
      ],
    } as any);

    vi.mocked(SessionSegmentRepository.getServiceAndStaff).mockResolvedValueOnce({
      product: { id: "srv-new", duration: 90, isActive: true },
      staff: { id: "staff-new", isActive: true },
      room: { id: "room-new", branchId: "br-1", isVip: false },
    } as any);

    vi.mocked(SessionSegmentRepository.updateScheduledSegment).mockResolvedValueOnce({
      id: "seg-1",
      serviceId: "srv-new",
    } as any);

    await SessionSegmentService.updateScheduledSegment({
      sessionId: "sess-1",
      segmentId: "seg-1",
      serviceId: "srv-new",
      staffId: "staff-new",
      roomId: "room-new",
    });

    const expectedEnd1 = new Date("2026-11-15T11:30:00.000Z");
    const expectedEnd2 = new Date("2026-11-15T12:30:00.000Z");

    expect(SessionSegmentRepository.updateScheduledSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-1",
        segmentId: "seg-1",
        serviceId: "srv-new",
        staffId: "staff-new",
        roomId: "room-new",
        durationMinutes: 90,
        startTime: start1,
        endTime: expectedEnd1,
        subsequentSegments: [{ id: "seg-2", startTime: expectedEnd1, endTime: expectedEnd2 }],
        sessionEndTime: expectedEnd2,
        updateSessionSummary: true,
      })
    );
  });
});
