export const parseCommaSeparated = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : [String(v)]))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

export const getRandomOption = (value) => {
  const options = parseCommaSeparated(value);
  if (options.length === 0) return '';
  return options[Math.floor(Math.random() * options.length)];
};

export const hasOverlap = (listA, listB) => {
  if (!listA || !listB) return false;
  const setB = new Set(listB.map((s) => s.toLowerCase().trim()));
  return listA.some((s) => setB.has(s.toLowerCase().trim()));
};

export const isItemEquivalent = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  return (
    hasOverlap(parseCommaSeparated(a.word), parseCommaSeparated(b.word)) ||
    hasOverlap(parseCommaSeparated(a.translation), parseCommaSeparated(b.translation))
  );
};

export const parseItemCategories = (item) => {
  if (!item || !item.category) return ['word'];
  const parts = parseCommaSeparated(item.category).map((s) => s.toLowerCase());
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
