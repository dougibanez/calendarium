"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSession } from "next-auth/react"
import Image from "next/image"

interface EventUser {
  id: string
  name: string | null
  image: string | null
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string | null
  allDay: boolean
  color: string
  user: EventUser
}

interface EventModalProps {
  mode: "create" | "view"
  selectedDate: Date | null
  selectedEvent: CalendarEvent | null
  onClose: () => void
  onEventCreated: () => void
  onEventDeleted: () => void
}

export default function EventModal({
  mode,
  selectedDate,
  selectedEvent,
  onClose,
  onEventCreated,
  onEventDeleted,
}: EventModalProps) {
  const { data: session } = useSession()

  const defaultDate =
    selectedDate ||
    (selectedEvent ? new Date(selectedEvent.startDate) : new Date())

  const [title, setTitle] = useState(selectedEvent?.title || "")
  const [description, setDescription] = useState(
    selectedEvent?.description || ""
  )
  const [startDate, setStartDate] = useState(
    selectedEvent
      ? format(new Date(selectedEvent.startDate), "yyyy-MM-dd")
      : format(defaultDate, "yyyy-MM-dd")
  )
  const [startTime, setStartTime] = useState(
    selectedEvent
      ? format(new Date(selectedEvent.startDate), "HH:mm")
      : format(defaultDate, "HH:mm")
  )
  const [endDate, setEndDate] = useState(
    selectedEvent?.endDate
      ? format(new Date(selectedEvent.endDate), "yyyy-MM-dd")
      : format(defaultDate, "yyyy-MM-dd")
  )
  const [endTime, setEndTime] = useState(
    selectedEvent?.endDate
      ? format(new Date(selectedEvent.endDate), "HH:mm")
      : format(defaultDate, "HH:mm")
  )
  const [allDay, setAllDay] = useState(selectedEvent?.allDay || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !title.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      const startDateTime = allDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime}:00`)
      const endDateTime = allDay
        ? new Date(`${endDate}T23:59:59`)
        : new Date(`${endDate}T${endTime}:00`)

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          allDay,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Error al guardar el evento")
        return
      }

      onEventCreated()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        onEventDeleted()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const isOwner = session?.user?.id === selectedEvent?.user?.id

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-base font-semibold text-slate-900">
            {mode === "create" ? "Nuevo evento" : "Detalle del evento"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mode === "view" && selectedEvent ? (
          /* View mode */
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 text-lg leading-tight">
                  {selectedEvent.title}
                </h4>
                {selectedEvent.description && (
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    {selectedEvent.description}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="capitalize">
                  {format(
                    new Date(selectedEvent.startDate),
                    "EEEE d 'de' MMMM, yyyy",
                    { locale: es }
                  )}
                </span>
              </div>
              {!selectedEvent.allDay && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {format(new Date(selectedEvent.startDate), "HH:mm")}
                    {selectedEvent.endDate &&
                      ` — ${format(new Date(selectedEvent.endDate), "HH:mm")}`}
                  </span>
                </div>
              )}
              {selectedEvent.allDay && (
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                  </svg>
                  <span>Todo el día</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {selectedEvent.user.image ? (
                <Image
                  src={selectedEvent.user.image}
                  alt={selectedEvent.user.name || ""}
                  width={28}
                  height={28}
                  className="rounded-full ring-2 ring-slate-100"
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: selectedEvent.color }}
                >
                  {selectedEvent.user.name?.[0]}
                </div>
              )}
              <span className="text-sm text-slate-600">
                {selectedEvent.user.name}
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              {isOwner ? (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Create mode */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Título <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                placeholder="¿Qué evento es?"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles opcionales..."
                rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm transition-shadow"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                className={`w-9 h-5 rounded-full transition-colors relative ${allDay ? "bg-blue-500" : "bg-slate-200"}`}
                onClick={() => setAllDay(!allDay)}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${allDay ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Todo el día
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-2.5 px-4 bg-blue-500 text-white hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
