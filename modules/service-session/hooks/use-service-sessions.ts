"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  getServiceSessionsAction,
  getServiceSessionFilterOptionsAction,
} from "../actions/service-session-action"
import type { ServiceSessionStatus } from "../schemas/service-session-query-schema"

export interface ServiceSessionItem {
  id: string
  branchId: string
  roomId: string
  roomName: string
  roomIsVip: boolean
  serviceId: string
  serviceName: string
  servicePrice: number | null
  serviceDuration: number | null
  status: string
  startTime: Date | string | null
  endTime: Date | string | null
  actualStartTime: Date | string | null
  actualEndTime: Date | string | null
  staffId: string | null
  staffName: string | null
  staffPhone: string | null
  customer: {
    id?: string
    name: string
    phone?: string | null
    email?: string | null
  } | null
  bookingId: string | null
  bookingNumber: string | null
  bookingStatus: string | null
  transactionItemId: string | null
  transactionId: string | null
  transactionNumber: string | null
  transactionStatus: string | null
  rating: number | null
  reviewComment: string | null
  therapistCommissionAmount: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface UseServiceSessionsProps {
  tenantSlug: string
  initialData?: {
    items: ServiceSessionItem[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    summary: {
      totalSessions: number
      inProgress: number
      scheduled: number
      completed: number
      cancelled: number
    }
  }
}

export function useServiceSessions({
  tenantSlug,
  initialData,
}: UseServiceSessionsProps) {
  const [sessions, setSessions] = useState<ServiceSessionItem[]>(
    initialData?.items ?? []
  )
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [status, setStatus] = useState<ServiceSessionStatus>("ALL")
  const [roomId, setRoomId] = useState<string>("ALL")
  const [staffId, setStaffId] = useState<string>("ALL")
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Pagination & stats
  const [page, setPage] = useState(initialData?.pagination.page ?? 1)
  const [limit, setLimit] = useState(initialData?.pagination.limit ?? 10)
  const [pagination, setPagination] = useState(
    initialData?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 }
  )
  const [summary, setSummary] = useState(
    initialData?.summary ?? {
      totalSessions: 0,
      inProgress: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
    }
  )

  // Filter options (rooms, staff)
  const [filterOptions, setFilterOptions] = useState<{
    rooms: Array<{ id: string; name: string; isVip?: boolean }>
    staffList: Array<{ id: string; name: string }>
  }>({ rooms: [], staffList: [] })

  // Modal detail
  const [selectedSession, setSelectedSession] =
    useState<ServiceSessionItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Fetch filter options on mount
  useEffect(() => {
    let isMounted = true
    getServiceSessionFilterOptionsAction(tenantSlug).then((res) => {
      if (isMounted && res.success && res.data) {
        setFilterOptions(res.data)
      }
    })
    return () => {
      isMounted = false
    }
  }, [tenantSlug])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const dateStr = date ? format(date, "yyyy-MM-dd") : undefined

    const res = await getServiceSessionsAction(tenantSlug, {
      search: searchTerm.trim() || undefined,
      status: status !== "ALL" ? status : undefined,
      roomId: roomId !== "ALL" ? roomId : undefined,
      staffId: staffId !== "ALL" ? staffId : undefined,
      date: dateStr,
      page,
      limit,
    })

    if (res.success && res.data) {
      setSessions(res.data.items as ServiceSessionItem[])
      setPagination(res.data.pagination)
      setSummary(res.data.summary)
    } else if (res.error) {
      toast.error(res.error)
    }
    setLoading(false)
  }, [tenantSlug, searchTerm, status, roomId, staffId, date, page, limit])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSessions()
    }, 400)
    return () => clearTimeout(handler)
  }, [fetchSessions])

  const handleResetFilters = () => {
    setSearchTerm("")
    setStatus("ALL")
    setRoomId("ALL")
    setStaffId("ALL")
    setDate(undefined)
    setPage(1)
  }

  const handleViewDetail = (session: ServiceSessionItem) => {
    setSelectedSession(session)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedSession(null)
  }

  return {
    sessions,
    loading,
    searchTerm,
    setSearchTerm,
    status,
    setStatus,
    roomId,
    setRoomId,
    staffId,
    setStaffId,
    date,
    setDate,
    page,
    setPage,
    limit,
    setLimit,
    pagination,
    summary,
    filterOptions,
    selectedSession,
    isDetailOpen,
    handleViewDetail,
    closeDetail,
    handleResetFilters,
    refresh: fetchSessions,
  }
}

