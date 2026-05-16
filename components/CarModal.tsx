"use client"

import { useState } from "react"

export interface MatchboxCar {
  id: string
  name: string
  year: number | null
  series: string | null
  color: string | null
  condition: string
  imageUrl: string | null
  notes: string | null
  price: number | null
  acquiredAt: string | null
  createdAt: string
}

interface CarModalProps {
  car: MatchboxCar | null
  onClose: () => void
  onSave: (car: MatchboxCar) => void
  onDelete?: (id: string) => void
}

const CONDITIONS = [
  { value: "MintInBox", label: "Caja sin abrir (MIB)" },
  { value: "Mint", label: "Perfecto (Mint)" },
  { value: "Excellent", label: "Excelente" },
  { value: "Good", label: "Bueno" },
  { value: "Fair", label: "Regular" },
  { value: "Poor", label: "Deteriorado" },
]

export default function CarModal({ car, onClose, onSave, onDelete }: CarModalProps) {
  const isEdit = !!car
  const [form, setForm] = useState({
    name: car?.name ?? "",
    year: car?.year?.toString() ?? "",
    series: car?.series ?? "",
    color: car?.color ?? "",
    condition: car?.condition ?? "Good",
    imageUrl: car?.imageUrl ?? "",
    notes: car?.notes ?? "",
    price: car?.price?.toString() ?? "",
    acquiredAt: car?.acquiredAt ? car.acquiredAt.split("T")[0] : "",
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      year: form.year ? parseInt(form.year) : null,
      series: form.series.trim() || null,
      color: form.color.trim() || null,
      condition: form.condition,
      imageUrl: form.imageUrl.trim() || null,
      notes: form.notes.trim() || null,
      price: form.price ? parseFloat(form.price) : null,
      acquiredAt: form.acquiredAt || null,
    }

    const url = isEdit ? `/api/matchbox/${car.id}` : "/api/matchbox"
    const method = isEdit ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const saved = await res.json()
      onSave(saved)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!car || !onDelete) return
    setDeleting(true)
    const res = await fetch(`/api/matchbox/${car.id}`, { method: "DELETE" })
    if (res.ok) onDelete(car.id)
    setDeleting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Editar auto" : "Agregar auto"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? "Modificá los datos del auto" : "Completá los datos del nuevo auto"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre del modelo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ej: Ford Mustang Boss"
              maxLength={100}
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Year + Series */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Año del modelo</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="ej: 1968"
                min={1950}
                max={2030}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Serie</label>
              <input
                type="text"
                value={form.series}
                onChange={(e) => set("series", e.target.value)}
                placeholder="ej: Moving Parts"
                maxLength={80}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Color + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="ej: Rojo metálico"
                maxLength={50}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
              <select
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 bg-white"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price + Acquired */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio pagado ($)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="ej: 250"
                min={0}
                step={0.01}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de adquisición</label>
              <input
                type="date"
                value={form.acquiredAt}
                onChange={(e) => set("acquiredAt", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">URL de imagen (opcional)</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Edición especial, dónde lo conseguiste, variantes..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={() => confirmDelete ? handleDelete() : setConfirmDelete(true)}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100 disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : confirmDelete ? "¿Confirmar?" : "Eliminar"}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.name.trim() || saving}
              className="px-6 py-2.5 text-sm font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 shadow-sm"
            >
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
