const STORAGE_PREFIX = 'groovegavel.auction-drafts.v1';

function storageKey(userId) {
  return `${STORAGE_PREFIX}.${userId}`;
}

function normaliseDraft(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    name: typeof value.name === 'string' ? value.name.slice(0, 100) : '',
    description: typeof value.description === 'string' ? value.description.slice(0, 2000) : '',
    starting_bid: Number.isSafeInteger(Number(value.starting_bid)) ? Number(value.starting_bid) : 0,
    end_date: typeof value.end_date === 'string' ? value.end_date : '',
    category_ids: Array.isArray(value.category_ids)
      ? [...new Set(value.category_ids.map(Number).filter(Number.isSafeInteger))].slice(0, 3)
      : [],
    updated_at: Number.isFinite(Number(value.updated_at)) ? Number(value.updated_at) : Date.now()
  };
}

export function listDrafts(userId) {
  if (!userId) return [];
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Saved drafts could not be read.');
  return parsed.map(normaliseDraft).filter(Boolean).sort((a, b) => b.updated_at - a.updated_at);
}

export function saveDraft(userId, draft) {
  const drafts = listDrafts(userId);
  const saved = normaliseDraft({
    ...draft,
    id: draft.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    updated_at: Date.now()
  });
  const updated = [saved, ...drafts.filter((item) => item.id !== saved.id)];
  localStorage.setItem(storageKey(userId), JSON.stringify(updated));
  return saved;
}

export function deleteDraft(userId, draftId) {
  const drafts = listDrafts(userId);
  const updated = drafts.filter((draft) => draft.id !== draftId);
  localStorage.setItem(storageKey(userId), JSON.stringify(updated));
  return updated;
}
