import { useState, useEffect } from "react"
import { differenceInMinutes, differenceInSeconds } from "date-fns"

export function useSessionTimer(actualStartTime: Date | null, expectedDurationMinutes: number) {
  const [runningSeconds, setRunningSeconds] = useState(0)

  useEffect(() => {
    if (!actualStartTime) return

    // Update every second
    const interval = setInterval(() => {
      setRunningSeconds(differenceInSeconds(new Date(), new Date(actualStartTime)))
    }, 1000)

    // Initial set
    setRunningSeconds(differenceInSeconds(new Date(), new Date(actualStartTime)))

    return () => clearInterval(interval)
  }, [actualStartTime])

  const runningMinutes = Math.floor(runningSeconds / 60)
  const remainingSeconds = runningSeconds % 60
  
  const formattedRunningTime = `${String(runningMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  
  const isEarly = expectedDurationMinutes > 0 ? runningMinutes < expectedDurationMinutes : false
  const earlyByMinutes = isEarly ? expectedDurationMinutes - runningMinutes : 0

  return {
    runningSeconds,
    runningMinutes,
    formattedRunningTime,
    isEarly,
    earlyByMinutes
  }
}
