"use client"

import { useState, useTransition } from "react"
import { createDeliveryNoteAction, deleteDeliveryNoteAction } from "@/src/actions/delivery.actions"
import type { DeliveryNote } from "@/src/types/delivery.types"
import { formatDateTime } from "@/src/lib/utils/dates"
import { StickyNote, Plus, Trash2, AlertCircle } from "lucide-react"

interface Props { notes: DeliveryNote[] }

export function DeliveryNotesClient({ notes: initialNotes }: Props) {
  const [isPending, startTransition] = useTransition()
  const [notes,     setNotes]        = useState<DeliveryNote[]>(initialNotes)
  const [content,   setContent]      = useState("")
  const [error,     setError]        = useState<string | null>(null)
  const [showForm,  setShowForm]     = useState(false)

  function handleAdd() {
    setError(null)
    const trimmed = content.trim()
    if (!trimmed) { setError("Escribí el contenido de la nota."); return }

    const tempId = `temp-${Date.now()}`
    const optimistic: DeliveryNote = {
      id:        tempId,
      content:   trimmed,
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [optimistic, ...prev])
    setContent("")
    setShowForm(false)

    startTransition(async () => {
      const result = await createDeliveryNoteAction({ content: trimmed })
      if (!result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== tempId))
        setError(result.error)
        setShowForm(true)
      }
    })
  }

  function handleDelete(noteId: string) {
    const removed = notes.find((n) => n.id === noteId)
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    startTransition(async () => {
      const result = await deleteDeliveryNoteAction(noteId)
      if (!result.success && removed) {
        setNotes((prev) => [removed, ...prev])
      }
    })
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <StickyNote className="size-4 text-amber-500" />
          <span className="card-title">Notas importantes</span>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-3.5" /> Nueva nota
        </button>
      </div>

      <div className="card-body space-y-3">
        {showForm && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <textarea
              className="form-input w-full resize-none"
              rows={3}
              placeholder='"Se le debe 10kg de pan rallado a Beto"'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" />{error}
              </p>
            )}
            <div className="flex gap-2">
              <button className="btn-primary btn-sm flex-1" onClick={handleAdd} disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar nota"}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => { setShowForm(false); setError(null) }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showForm && (
          <p className="py-4 text-center text-sm text-stone-400">No hay notas guardadas.</p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className={`flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition-opacity ${
              note.id.startsWith("temp-") ? "opacity-50" : ""
            }`}
          >
            <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 whitespace-pre-wrap">{note.content}</p>
              <p className="mt-1 text-xs text-stone-400">{formatDateTime(note.createdAt)}</p>
            </div>
            <button
              className="shrink-0 p-1 text-stone-300 hover:text-red-500 transition-colors"
              onClick={() => handleDelete(note.id)}
              disabled={note.id.startsWith("temp-")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
