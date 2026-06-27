import { useState, useEffect } from "react";
import { BUSINESS_HOURS_START, BUSINESS_HOURS_END, TOTAL_HOURS } from "./timetable-utils";

export function CurrentTimeLine({ date }: { date: Date }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Update every second for smooth movement
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const isToday = date.toDateString() === now.toDateString();
  const currentHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  
  if (!isToday || currentHour < BUSINESS_HOURS_START || currentHour > BUSINESS_HOURS_END) {
    return null;
  }

  const currentTimeLeft = ((currentHour - BUSINESS_HOURS_START) / TOTAL_HOURS) * 100;

  return (
    <div className="absolute top-0 bottom-0 right-0 left-48 z-40 pointer-events-none">
      <div 
        className="absolute top-0 bottom-0 w-px bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] z-50 transition-all duration-1000 ease-linear" 
        style={{ left: `${currentTimeLeft}%` }}
      >
        <div className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1">
          <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
}
