"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createDeliveryNoteAction,
  deleteDeliveryNoteAction,
} from "@/src/actions/delivery.actions";
import type { DeliveryNote } from "@/src/types/delivery.types";
import { formatDateTime } from "@/src/lib/utils/dates";
import { StickyNote, Plus, Trash2, AlertCircle } from "lucide-react";

interface Props {
  notes: DeliveryNote[];
}

export function DeliveryNotesClient({ notes: initialNotes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    if (!content.trim()) {
      setError("Escribí el contenido de la nota.");
      return;
    }

    startTransition(async () => {
      const result = await createDeliveryNoteAction({
        content: content.trim(),
      });

      if (!result.success) {
        setError(result.error);
      } else {
        setContent("");
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleDelete(noteId: string) {
    setDeletingId(noteId);
    startTransition(async () => {
      await deleteDeliveryNoteAction(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeletingId(null);
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <StickyNote className="size-4 text-amber-500" />
          <span className="card-title">Notas importantes</span>
        </div>
        <button
          className="btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="size-3.5" />
          Nueva nota
        </button>
      </div>

      <div className="card-body space-y-3">
        {/* Formulario nueva nota */}
        {showForm && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <textarea
              className="form-input resize-none w-full"
              rows={3}
              placeholder='Ej: "Se le debe 10kg de pan rallado a Beto"'
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                className="btn-primary btn-sm flex-1"
                onClick={handleAdd}
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar nota"}
              </button>
              <button
                className="btn-ghost btn-sm"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de notas */}
        {notes.length === 0 && !showForm && (
          <p className="py-4 text-center text-sm text-stone-400">
            No hay notas guardadas.
          </p>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4"
          >
            <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 whitespace-pre-wrap">
                {note.content}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {formatDateTime(note.createdAt)}
              </p>
            </div>
            <button
              className="shrink-0 p-1 text-stone-300 hover:text-red-500 transition-colors"
              onClick={() => handleDelete(note.id)}
              disabled={isPending && deletingId === note.id}
              title="Eliminar nota"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
