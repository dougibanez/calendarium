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
} from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"
import EventModal, { CalendarEvent } from "./EventModal"

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

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
      if (res.ok) {
        setEvents(await res.json())
      }
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

  // Build calendar grid
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = gridStart
  while (d <= gridEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const getEventsForDay = (day: Date) =>
    events.filter((ev) => isSameDay(new Date(ev.startDate), day))

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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          const inMonth = isSameMonth(day, currentDate)
          const isCurrentDay = isToday(day)
          const canCreate = !!session

          return (
            <div
              key={day.toISOString()}
              onClick={() => openCreateModal(day)}
              className={[
                "min-h-[90px] sm:min-h-[110px] p-1.5 rounded-xl border transition-all",
                inMonth
                  ? canCreate
                    ? "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
                    : "bg-white border-slate-200"
                  : "bg-slate-50/60 border-transparent",
                isCurrentDay ? "border-blue-400 ring-1 ring-blue-400/30" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs sm:text-sm font-medium mb-1",
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
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => openViewModal(e, event)}
                    className="w-full text-left text-xs px-1.5 py-0.5 rounded-md text-white truncate transition-opacity hover:opacity-80"
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
      </div>

      {/* Legend: show who has events this month */}
      {events.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {Array.from(
            new Map(events.map((e) => [e.user.id, e.user])).values()
          ).map((user) => {
            const userColor = events.find((e) => e.user.id === user.id)?.color
            return (
              <div key={user.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: userColor }}
                />
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
