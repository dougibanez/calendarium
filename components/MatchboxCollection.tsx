"use client"

import { useState, useEffect, useMemo } from "react"
import CarModal, { type MatchboxCar } from "./CarModal"

const CONDITIONS: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  MintInBox:  { label: "Caja sin abrir", bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500",  border: "border-purple-200" },
  Mint:       { label: "Perfecto",        bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  Excellent:  { label: "Excelente",       bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    border: "border-blue-200" },
  Good:       { label: "Bueno",           bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-400",  border: "border-yellow-200" },
  Fair:       { label: "Regular",         bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  border: "border-orange-200" },
  Poor:       { label: "Deteriorado",     bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     border: "border-red-200" },
}

function ConditionBadge({ condition }: { condition: string }) {
  const c = CONDITIONS[condition] ?? CONDITIONS.Good
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

function CarSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" className={className}>
      <rect x="8" y="18" width="48" height="16" rx="4" fill="currentColor" opacity="0.15" />
      <path d="M14 18 L20 8 L44 8 L50 18" fill="currentColor" opacity="0.2" />
      <path d="M14 18 L20 10 L44 10 L50 18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <rect x="8" y="18" width="48" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="18" cy="34" r="5" stroke="currentColor" strokeWidth="1.5" fill="white" />
      <circle cx="18" cy="34" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="46" cy="34" r="5" stroke="currentColor" strokeWidth="1.5" fill="white" />
      <circle cx="46" cy="34" r="2" fill="currentColor" opacity="0.3" />
      <rect x="22" y="11" width="10" height="7" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
      <rect x="34" y="11" width="10" height="7" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

function CarCard({ car, onClick }: { car: MatchboxCar; onClick: () => void }) {
  const [imgError, setImgError] = useState(false)
  const c = CONDITIONS[car.condition] ?? CONDITIONS.Good

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group text-left w-full"
    >
      {/* Image area */}
      <div className={`h-36 flex items-center justify-center relative overflow-hidden ${c.bg}`}>
        {car.imageUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={car.imageUrl}
            alt={car.name}
            className="w-full h-full object-contain p-3"
            onError={() => setImgError(true)}
          />
        ) : (
          <CarSvg className={`w-24 h-16 ${c.text} opacity-60`} />
        )}
        <div className="absolute top-2 left-2">
          <ConditionBadge condition={car.condition} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem]">
          {car.name}
        </h3>
        <div className="mt-2 space-y-0.5">
          {(car.year || car.series) && (
            <p className="text-xs text-slate-500 truncate">
              {[car.year, car.series].filter(Boolean).join(" · ")}
            </p>
          )}
          {car.color && (
            <p className="text-xs text-slate-400 truncate">{car.color}</p>
          )}
        </div>
        {car.price != null && (
          <p className="mt-2 text-xs font-semibold text-slate-500">
            ${car.price % 1 === 0 ? car.price.toFixed(0) : car.price.toFixed(2)}
          </p>
        )}
      </div>
    </button>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-28 h-28 bg-orange-50 rounded-3xl flex items-center justify-center mb-6">
        <CarSvg className="w-20 h-14 text-orange-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">La colección está vacía</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
        Todavía no tenés autos registrados. ¡Comenzá a armar tu colección!
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm"
      >
        Agregar primer auto
      </button>
    </div>
  )
}

export default function MatchboxCollection() {
  const [cars, setCars] = useState<MatchboxCar[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<MatchboxCar | null>(null)
  const [search, setSearch] = useState("")
  const [filterCondition, setFilterCondition] = useState("all")
  const [filterSeries, setFilterSeries] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  useEffect(() => {
    fetch("/api/matchbox")
      .then((r) => r.json())
      .then(setCars)
      .finally(() => setLoading(false))
  }, [])

  const series = useMemo(() => {
    const s = new Set(cars.map((c) => c.series).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [cars])

  const filtered = useMemo(() => {
    let result = cars
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.series?.toLowerCase().includes(q) ||
          c.color?.toLowerCase().includes(q) ||
          c.year?.toString().includes(q)
      )
    }
    if (filterCondition !== "all") result = result.filter((c) => c.condition === filterCondition)
    if (filterSeries !== "all") result = result.filter((c) => c.series === filterSeries)

    return [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "year") return (b.year ?? 0) - (a.year ?? 0)
      if (sortBy === "condition") return Object.keys(CONDITIONS).indexOf(a.condition) - Object.keys(CONDITIONS).indexOf(b.condition)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [cars, search, filterCondition, filterSeries, sortBy])

  const stats = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of cars) map[c.condition] = (map[c.condition] ?? 0) + 1
    return map
  }, [cars])

  const openAdd = () => { setSelectedCar(null); setModalOpen(true) }
  const openEdit = (car: MatchboxCar) => { setSelectedCar(car); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setSelectedCar(null) }

  const handleSave = (car: MatchboxCar) => {
    setCars((prev) => {
      const exists = prev.find((c) => c.id === car.id)
      return exists ? prev.map((c) => (c.id === car.id ? car : c)) : [car, ...prev]
    })
    closeModal()
  }

  const handleDelete = (id: string) => {
    setCars((prev) => prev.filter((c) => c.id !== id))
    closeModal()
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Cargando colección...</p>
        </div>
      </div>
    )
  }

  const isFiltered = search || filterCondition !== "all" || filterSeries !== "all"

  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Colección Matchbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            {cars.length === 0
              ? "Sin autos registrados aún"
              : `${cars.length} auto${cars.length !== 1 ? "s" : ""} en la colección`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-sm text-sm flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Agregar auto</span>
          <span className="sm:hidden">Agregar</span>
        </button>
      </div>

      {/* Stats strip */}
      {cars.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {Object.entries(CONDITIONS).map(([key, c]) => {
            const count = stats[key] ?? 0
            const active = filterCondition === key
            return (
              <button
                key={key}
                onClick={() => setFilterCondition(active ? "all" : key)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  active
                    ? `${c.bg} ${c.border} shadow-sm`
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`text-xl font-bold ${active ? c.text : "text-slate-900"}`}>{count}</div>
                <div className={`text-xs mt-0.5 leading-tight ${active ? c.text : "text-slate-500"}`}>{c.label}</div>
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {cars.length === 0 ? (
        <EmptyState onAdd={openAdd} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, serie, color, año..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {series.length > 0 && (
              <select
                value={filterSeries}
                onChange={(e) => setFilterSeries(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="all">Todas las series</option>
                {series.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="recent">Más reciente</option>
              <option value="name">Nombre A–Z</option>
              <option value="year">Año (reciente)</option>
              <option value="condition">Estado</option>
            </select>
          </div>

          {/* Results info */}
          {isFiltered && (
            <p className="text-xs text-slate-400 mb-3">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}{" "}
              &mdash;{" "}
              <button
                onClick={() => { setSearch(""); setFilterCondition("all"); setFilterSeries("all") }}
                className="text-orange-500 hover:text-orange-600 underline"
              >
                limpiar filtros
              </button>
            </p>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium text-slate-500 mb-1">Sin resultados</p>
              <p className="text-sm text-slate-400">Probá con otros filtros o términos de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((car) => (
                <CarCard key={car.id} car={car} onClick={() => openEdit(car)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <CarModal
          car={selectedCar}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={selectedCar ? handleDelete : undefined}
        />
      )}
    </main>
  )
}
