"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
const LANE_H = 22
const BAR_TOP_OFFSET = 4
const MONTHS_BEFORE = 12
const MONTHS_AFTER = 12

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
  const today = useMemo(() => new Date(), [])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "view">("create")
  const todayMonthRef = useRef<HTMLDivElement>(null)
  const didScroll = useRef(false)

  const months = useMemo(
    () =>
      Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) =>
        addMonths(startOfMonth(today), i - MONTHS_BEFORE)
      ),
    [today]
  )

  const fetchEvents = useCallback(async () => {
    const rangeStart = startOfWeek(months[0], { weekStartsOn: 1 })
    const rangeEnd = endOfWeek(months[months.length - 1], { weekStartsOn: 1 })
    const res = await fetch(
      `/api/events?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`
    )
    if (res.ok) setEvents(await res.json())
  }, [months])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Scroll to current month once on mount (after first render)
  useEffect(() => {
    if (didScroll.current) return
    const el = todayMonthRef.current
    if (!el) return
    el.scrollIntoView({ block: "start", behavior: "instant" })
    didScroll.current = true
  })

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

  const scrollToToday = () => {
    todayMonthRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }

  // Participants derived from loaded events
  const participants = useMemo(
    () => Array.from(new Map(events.map((e) => [e.user.id, e])).values()),
    [events]
  )

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Sticky week-days header */}
      <div className="grid grid-cols-7 bg-white border-b border-slate-200 px-3 flex-shrink-0">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Scrollable months */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {months.map((monthDate) => {
          const isCurrentMonth = isSameMonth(monthDate, today)

          const monthStart = startOfMonth(monthDate)
          const monthEnd = endOfMonth(monthDate)
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
            singleDayEvents.filter((ev) =>
              isSameDay(new Date(ev.startDate), day)
            )

          return (
            <div
              key={monthDate.toISOString()}
              ref={isCurrentMonth ? todayMonthRef : undefined}
            >
              {/* Month title row */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2
                  className={[
                    "text-sm font-bold capitalize",
                    isCurrentMonth ? "text-blue-600" : "text-slate-500",
                  ].join(" ")}
                >
                  {format(monthDate, "MMMM yyyy", { locale: es })}
                </h2>
                {isCurrentMonth && (
                  <button
                    onClick={scrollToToday}
                    className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                  >
                    Hoy
                  </button>
                )}
              </div>

              {/* Week grid */}
              <div className="px-3 pb-3 space-y-0.5">
                {weeks.map((week, weekIdx) => {
                  const weekStart = startOfDay(week[0])
                  const weekEnd = startOfDay(week[6])
                  const weekSpans = getWeekSpans(events, weekStart, weekEnd)
                  const numLanes =
                    weekSpans.length > 0
                      ? Math.max(...weekSpans.map((s) => s.lane)) + 1
                      : 0
                  const reservedTop =
                    numLanes > 0 ? BAR_TOP_OFFSET + numLanes * LANE_H + 4 : 6

                  return (
                    <div
                      key={weekIdx}
                      className="relative grid grid-cols-7 rounded-xl overflow-hidden border border-slate-200"
                    >
                      {week.map((day, i) => {
                        const dayEvents = getDaySingleEvents(day)
                        const inMonth = isSameMonth(day, monthDate)
                        const isCurrentDay = isToday(day)
                        const canCreate = !!session && inMonth

                        return (
                          <div
                            key={day.toISOString()}
                            onClick={() => canCreate && openCreateModal(day)}
                            className={[
                              "min-h-[76px] px-1 pb-1 transition-colors",
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
                            <div
                              className={[
                                "w-6 h-6 flex items-center justify-center rounded-full",
                                "text-xs font-medium mb-0.5",
                                isCurrentDay
                                  ? "bg-blue-500 text-white"
                                  : inMonth
                                  ? "text-slate-700"
                                  : "text-slate-300",
                              ].join(" ")}
                            >
                              {format(day, "d")}
                            </div>

                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 2).map((event) => (
                                <button
                                  key={event.id}
                                  onClick={(e) => openViewModal(e, event)}
                                  className="w-full text-left text-xs px-1 py-0.5 rounded-md text-white truncate hover:opacity-80 transition-opacity"
                                  style={{ backgroundColor: event.color }}
                                  title={`${event.title} — ${event.user.name}`}
                                >
                                  <span className="hidden sm:inline">
                                    {event.title}
                                  </span>
                                  <span className="sm:hidden">•</span>
                                </button>
                              ))}
                              {dayEvents.length > 2 && (
                                <p className="text-xs text-slate-400 pl-0.5">
                                  +{dayEvents.length - 2}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {weekSpans.map((span) => {
                        const leftPct = (span.startCol / 7) * 100
                        const widthPct =
                          ((span.endCol - span.startCol + 1) / 7) * 100
                        const insetPx = 3

                        return (
                          <button
                            key={`${span.event.id}-w${weekIdx}`}
                            onClick={(e) => openViewModal(e, span.event)}
                            className="absolute flex items-center text-xs font-medium text-white hover:opacity-80 transition-opacity focus:outline-none"
                            style={{
                              left: `calc(${leftPct}% + ${span.isStart ? insetPx : 0}px)`,
                              width: `calc(${widthPct}% - ${span.isStart ? insetPx : 0}px - ${span.isEnd ? insetPx : 0}px)`,
                              top: BAR_TOP_OFFSET + span.lane * LANE_H + "px",
                              height: "20px",
                              backgroundColor: span.event.color,
                              borderTopLeftRadius: span.isStart ? 999 : 2,
                              borderBottomLeftRadius: span.isStart ? 999 : 2,
                              borderTopRightRadius: span.isEnd ? 999 : 2,
                              borderBottomRightRadius: span.isEnd ? 999 : 2,
                            }}
                            title={span.event.title}
                          >
                            <span className="px-2 truncate leading-none">
                              {span.event.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Separator between months */}
              <div className="mx-3 border-t border-slate-100" />
            </div>
          )
        })}

        {/* Participants legend */}
        {participants.length > 0 && (
          <div className="px-4 py-4 flex flex-wrap gap-3">
            {participants.map(({ user, color }) => (
              <div key={user.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-500">{user.name}</span>
              </div>
            ))}
          </div>
        )}

        {!session && (
          <p className="text-center text-sm text-slate-400 mt-4 px-4 pb-8">
            Inicia sesión para agregar eventos al calendario
          </p>
        )}
      </div>

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
    </div>
  )
}
