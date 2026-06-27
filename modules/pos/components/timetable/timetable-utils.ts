export const BUSINESS_HOURS_START = 8;
export const BUSINESS_HOURS_END = 22;
export const TOTAL_HOURS = BUSINESS_HOURS_END - BUSINESS_HOURS_START;

export function calculateSessionLanes(sessions: any[]) {
  const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const lanes: any[][] = [];

  const positionedSessions = sorted.map(session => {
    if (!session.startTime) return { ...session, lane: 0 };
    const start = new Date(session.startTime).getTime();
    const end = session.endTime ? new Date(session.endTime).getTime() : start + 60 * 60 * 1000;

    let assignedLane = 0;
    while (true) {
      if (!lanes[assignedLane]) {
        lanes[assignedLane] = [];
        break;
      }

      const overlap = lanes[assignedLane].some(s => {
        const sStart = new Date(s.startTime).getTime();
        const sEnd = s.endTime ? new Date(s.endTime).getTime() : sStart + 60 * 60 * 1000;
        return (start < sEnd && end > sStart);
      });

      if (!overlap) break;
      assignedLane++;
    }

    lanes[assignedLane].push(session);
    return { ...session, lane: assignedLane };
  });

  return { positionedSessions, maxLane: lanes.length > 0 ? lanes.length - 1 : 0 };
}

export function getDiffString(future: Date, past: Date) {
  const diffMs = Math.abs(future.getTime() - past.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}
