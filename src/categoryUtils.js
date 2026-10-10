export const parseItemCategories = (item) => {
  if (!item || !item.category) return ['word'];
  const raw = typeof item.category === 'string' ? item.category : '';
  const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (parts.length === 0) return ['word'];
  return parts.map((c) => (c === 'words' ? 'word' : c));
};

export const formatCategoryName = (cat) => {
  if (!cat) return '';
  return cat
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const CATEGORY_ICONS = {
  class: '🏫',
  command: '🗣️',
  country: '🌍',
  day: '📅',
  family: '👨‍👩‍👧',
  'family phrase': '💬',
  greeting: '👋',
  honorifics: '🎩',
  location: '📍',
  months: '🗓️',
  object: '📦',
  person: '👤',
  phrase: '💭',
  pronoun: '🔤',
  word: '📝',
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category.toLowerCase()] || '🏷️';
};
