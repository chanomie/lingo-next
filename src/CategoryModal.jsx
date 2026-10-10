import React, { useState, useEffect, useMemo } from 'react';
import { formatCategoryName, getCategoryIcon, parseItemCategories } from './categoryUtils';

function CategoryModal({
  onClose,
  allCategories,
  categoryCounts,
  selectedCategories,
  onApply,
  vocab,
}) {
  const [tempSelected, setTempSelected] = useState(() => new Set(selectedCategories));

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (tempSelected.size > 0) {
          onApply(tempSelected);
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onApply, tempSelected]);

  // Calculate how many words match the current temp selection
  const matchingWordsCount = useMemo(() => {
    if (!vocab || tempSelected.size === 0) return 0;
    return vocab.filter((item) => {
      const cats = parseItemCategories(item);
      return cats.some((c) => tempSelected.has(c));
    }).length;
  }, [vocab, tempSelected]);

  const handleToggle = (cat) => {
    setTempSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setTempSelected(new Set(allCategories));
  };

  const handleDeselectAll = () => {
    setTempSelected(new Set());
  };

  const handleApply = () => {
    if (tempSelected.size === 0) return;
    onApply(tempSelected);
    onClose();
  };

  const isAllSelected = tempSelected.size === allCategories.length;
  const isNoneSelected = tempSelected.size === 0;

  return (
    <div className="overlay category-modal-overlay" onClick={onClose}>
      <div
        className="glass-panel category-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
      >
        {/* Header */}
        <div className="category-modal-header">
          <div>
            <h2 id="category-modal-title" className="category-modal-title">
              Catégories
            </h2>
            <p className="category-modal-subtitle">
              {tempSelected.size} sur {allCategories.length} sélectionnée{tempSelected.size > 1 ? 's' : ''} •{' '}
              <span className="category-word-count-badge">{matchingWordsCount} mots</span>
            </p>
          </div>
          <button
            type="button"
            className="category-modal-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="category-modal-actions">
          <button
            type="button"
            className={`category-action-btn ${isAllSelected ? 'active' : ''}`}
            onClick={handleSelectAll}
          >
            ✓ Tout sélectionner
          </button>
          <button
            type="button"
            className={`category-action-btn ${isNoneSelected ? 'active' : ''}`}
            onClick={handleDeselectAll}
          >
            ✕ Tout désélectionner
          </button>
        </div>

        {/* List of categories */}
        <div className="category-list">
          {allCategories.map((cat) => {
            const isSelected = tempSelected.has(cat);
            const count = categoryCounts[cat] || 0;
            const icon = getCategoryIcon(cat);

            return (
              <button
                type="button"
                key={cat}
                className={`category-item-btn ${isSelected ? 'selected' : 'unselected'}`}
                onClick={() => handleToggle(cat)}
                aria-pressed={isSelected}
              >
                <div className="category-item-left">
                  <span className="category-item-icon">{icon}</span>
                  <div className="category-item-text">
                    <span className="category-item-name">{formatCategoryName(cat)}</span>
                    <span className="category-item-count">
                      {count} {count === 1 ? 'mot' : 'mots'}
                    </span>
                  </div>
                </div>

                <div className={`category-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected ? '✓' : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info & Apply button */}
        <div className="category-modal-footer">
          {isNoneSelected ? (
            <p className="category-empty-warning">
              ⚠️ Sélectionnez au moins une catégorie pour pratiquer.
            </p>
          ) : null}
          <button
            type="button"
            className="category-apply-btn"
            onClick={handleApply}
            disabled={isNoneSelected}
          >
            {isNoneSelected
              ? 'Sélectionnez une catégorie'
              : `Pratiquer (${matchingWordsCount} mots)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;
