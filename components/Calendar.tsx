"use client"

import { useState, useEffect, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  differenceInDays,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"
import EventModal, { CalendarEvent } from "./EventModal"

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MAX_LANES = 3
const LANE_H = 22 // px per lane (20px bar + 2px gap)
const BAR_TOP_OFFSET = 4 // px from top of cell to first bar

export function isMultiDay(event: CalendarEvent): boolean {
  if (!event.endDate) return false
  return !isSameDay(
    startOfDay(new Date(event.startDate)),
    startOfDay(new Date(event.endDate))
  )
}

interface WeekSpan {
  event: CalendarEvent
  startCol: number
  endCol: number
  isStart: boolean
  isEnd: boolean
  lane: number
}

function getWeekSpans(
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): WeekSpan[] {
  const spans: WeekSpan[] = events
    .filter((ev) => {
      if (!ev.endDate) return false
      const s = startOfDay(new Date(ev.startDate))
      const e = startOfDay(new Date(ev.endDate))
      if (isSameDay(s, e)) return false
      return !isAfter(s, weekEnd) && !isBefore(e, weekStart)
    })
    .map((ev) => {
      const evS = startOfDay(new Date(ev.startDate))
      const evE = startOfDay(new Date(ev.endDate!))
      const cS = isBefore(evS, weekStart) ? weekStart : evS
      const cE = isAfter(evE, weekEnd) ? weekEnd : evE
      return {
        event: ev,
        startCol: differenceInDays(cS, weekStart),
        endCol: differenceInDays(cE, weekStart),
        isStart: isSameDay(cS, evS),
        isEnd: isSameDay(cE, evE),
        lane: -1,
      }
    })
    .sort((a, b) =>
      a.startCol !== b.startCol
        ? a.startCol - b.startCol
        : b.endCol - b.startCol - (a.endCol - a.startCol)
    )

  for (let i = 0; i < spans.length; i++) {
    let lane = 0
    while (lane < MAX_LANES) {
      const conflict = spans
        .slice(0, i)
        .some(
          (s) =>
            s.lane === lane &&
            s.startCol <= spans[i].endCol &&
            s.endCol >= spans[i].startCol
        )
      if (!conflict) break
      lane++
    }
    spans[i].lane = lane
  }

  return spans.filter((s) => s.lane < MAX_LANES)
}

export default function Calendar() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "view">("create")

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      const res = await fetch(
        `/api/events?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`
      )
      if (res.ok) setEvents(await res.json())
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const openCreateModal = (day: Date) => {
    if (!session) return
    setSelectedDate(day)
    setSelectedEvent(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const openViewModal = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setSelectedDate(null)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDate(null)
    setSelectedEvent(null)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let d = gridStart
  while (!isAfter(d, gridEnd)) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(d)
      d = addDays(d, 1)
    }
    weeks.push(week)
  }

  const singleDayEvents = events.filter((ev) => !isMultiDay(ev))
  const getDaySingleEvents = (day: Date) =>
    singleDayEvents.filter((ev) => isSameDay(new Date(ev.startDate), day))

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200"
          aria-label="Mes anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-900 capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h2>
          {!isToday(currentDate) && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
            >
              Hoy
            </button>
          )}
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200"
          aria-label="Mes siguiente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div className="space-y-1">
        {weeks.map((week, weekIdx) => {
          const weekStart = startOfDay(week[0])
          const weekEnd = startOfDay(week[6])
          const weekSpans = getWeekSpans(events, weekStart, weekEnd)
          const numLanes =
            weekSpans.length > 0 ? Math.max(...weekSpans.map((s) => s.lane)) + 1 : 0

          // Space reserved at the top of each cell for multi-day bars
          const reservedTop =
            numLanes > 0 ? BAR_TOP_OFFSET + numLanes * LANE_H + 4 : 6

          return (
            // Week row: position:relative so bars can be absolutely positioned inside
            <div
              key={weekIdx}
              className="relative grid grid-cols-7 rounded-xl overflow-hidden border border-slate-200"
            >
              {/* ── Day cells ── */}
              {week.map((day, i) => {
                const dayEvents = getDaySingleEvents(day)
                const inMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const canCreate = !!session && inMonth

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => canCreate && openCreateModal(day)}
                    className={[
                      "min-h-[88px] px-1.5 pb-1.5 transition-colors",
                      i > 0 ? "border-l border-slate-100" : "",
                      isCurrentDay
                        ? "bg-blue-50/60"
                        : inMonth
                        ? canCreate
                          ? "bg-white hover:bg-blue-50/30 cursor-pointer"
                          : "bg-white"
                        : "bg-slate-50/50",
                    ].join(" ")}
                    style={{ paddingTop: reservedTop + "px" }}
                  >
                    {/* Day number */}
                    <div
                      className={[
                        "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full",
                        "text-xs sm:text-sm font-medium mb-1",
                        isCurrentDay
                          ? "bg-blue-500 text-white"
                          : inMonth
                          ? "text-slate-700"
                          : "text-slate-300",
                      ].join(" ")}
                    >
                      {format(day, "d")}
                    </div>

                    {/* Single-day event pills */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          onClick={(e) => openViewModal(e, event)}
                          className="w-full text-left text-xs px-1.5 py-0.5 rounded-md text-white truncate hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: event.color }}
                          title={`${event.title} — ${event.user.name}`}
                        >
                          <span className="hidden sm:inline">{event.title}</span>
                          <span className="sm:hidden">•</span>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-slate-400 pl-1">
                          +{dayEvents.length - 3}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ── Multi-day bars ──
                  Absolutely positioned inside the week row.
                  left/width use % of the row width (7 equal columns, no gap).
                  top uses lane index so multiple bars stack without overlap.
              */}
              {weekSpans.map((span) => {
                const leftPct = (span.startCol / 7) * 100
                const widthPct = ((span.endCol - span.startCol + 1) / 7) * 100
                const insetPx = 3 // visual breathing room at real start/end

                return (
                  <button
                    key={`${span.event.id}-w${weekIdx}`}
                    onClick={(e) => openViewModal(e, span.event)}
                    className="absolute flex items-center text-xs font-medium text-white hover:opacity-80 transition-opacity focus:outline-none"
                    style={{
                      // Horizontal position
                      left: `calc(${leftPct}% + ${span.isStart ? insetPx : 0}px)`,
                      width: `calc(${widthPct}% - ${span.isStart ? insetPx : 0}px - ${span.isEnd ? insetPx : 0}px)`,
                      // Vertical position inside the reserved zone
                      top: BAR_TOP_OFFSET + span.lane * LANE_H + "px",
                      height: "20px",
                      backgroundColor: span.event.color,
                      // Round only the real edges of the event
                      borderTopLeftRadius: span.isStart ? 999 : 2,
                      borderBottomLeftRadius: span.isStart ? 999 : 2,
                      borderTopRightRadius: span.isEnd ? 999 : 2,
                      borderBottomRightRadius: span.isEnd ? 999 : 2,
                    }}
                    title={span.event.title}
                  >
                    <span className="px-2 truncate leading-none">{span.event.title}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Participants legend */}
      {events.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {Array.from(
            new Map(events.map((e) => [e.user.id, e.user])).values()
          ).map((user) => {
            const color = events.find((e) => e.user.id === user.id)?.color
            return (
              <div key={user.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500">{user.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {!session && (
        <p className="text-center text-sm text-slate-400 mt-4">
          Iniciá sesión para agregar eventos al calendario
        </p>
      )}

      {isModalOpen && (
        <EventModal
          mode={modalMode}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onClose={closeModal}
          onEventCreated={() => {
            fetchEvents()
            closeModal()
          }}
          onEventDeleted={() => {
            fetchEvents()
            closeModal()
          }}
        />
      )}
    </main>
  )
}
