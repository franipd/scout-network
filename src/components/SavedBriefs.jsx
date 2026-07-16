import { useState } from 'react';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

/**
 * The briefing archive. Every completed run is saved automatically with a
 * matchup-derived name and a timestamp; names are editable inline.
 */
export default function SavedBriefs({ briefs, activeId, disabled, onOpen, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  if (!briefs.length) return null;

  const startEdit = (b) => {
    setEditingId(b.id);
    setDraft(b.name);
  };
  const commit = (id) => {
    onRename(id, draft);
    setEditingId(null);
  };

  return (
    <section className="saved" aria-label="Saved briefings">
      <div className="saved-head">
        Saved briefings · {briefs.length}
        <span className="saved-hint">stored in this browser only</span>
      </div>
      <ul className="saved-list">
        {briefs.map((b) => (
          <li key={b.id} className={`saved-row${b.id === activeId ? ' saved-active' : ''}`}>
            {editingId === b.id ? (
              <input
                className="saved-input"
                value={draft}
                autoFocus
                aria-label="Briefing name"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit(b.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={() => commit(b.id)}
              />
            ) : (
              <button
                className="saved-open"
                onClick={() => onOpen(b.id)}
                disabled={disabled}
                title="Open this briefing"
              >
                {b.name}
              </button>
            )}
            <span className="saved-date">{formatDate(b.savedAt)}</span>
            <button
              className="saved-act"
              onClick={() => startEdit(b)}
              disabled={disabled || editingId === b.id}
              aria-label={`Rename ${b.name}`}
            >
              rename
            </button>
            <button
              className="saved-act saved-del"
              onClick={() => onDelete(b.id)}
              disabled={disabled}
              aria-label={`Delete ${b.name}`}
            >
              delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
