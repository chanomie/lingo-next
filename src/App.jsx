import React, { useState, useEffect, useCallback } from 'react';

function App() {
  const [vocab, setVocab] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [clickedChoices, setClickedChoices] = useState({}); // maps option index -> 'correct' | 'incorrect'
  const [hasFailedThisTurn, setHasFailedThisTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load vocab configuration
  useEffect(() => {
    fetch(`/vocab/fr.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => {
        setVocab(data);
      })
      .catch((err) => console.error('Failed to load vocabulary config:', err));
  }, []);

  // Generate a new flashcard question
  const nextQuestion = useCallback(() => {
    if (vocab.length < 4) return;

    // Pick a random word from vocab as the correct answer
    const correctIdx = Math.floor(Math.random() * vocab.length);
    const correctItem = vocab[correctIdx];

    // Pick 3 unique incorrect answers from the rest of the vocab
    const pool = vocab.filter((_, idx) => idx !== correctIdx);
    const incorrectItems = [];
    while (incorrectItems.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      const item = pool[randIdx];
      if (!incorrectItems.some((x) => x.word === item.word)) {
        incorrectItems.push(item);
      }
    }

    // Determine correct representation (text translation or picture if exists)
    // 50% chance to show picture if it exists, otherwise text translation
    const usePicture = !!correctItem.picture && Math.random() < 0.5;

    // Map correct and incorrect items into options
    const choices = [
      {
        id: 'correct',
        text: usePicture ? null : correctItem.translation,
        picture: usePicture ? correctItem.picture : null,
        isCorrect: true,
      },
      ...incorrectItems.map((item, idx) => ({
        id: `incorrect-${idx}`,
        text: item.translation,
        picture: null,
        isCorrect: false,
      })),
    ];

    // Shuffle choices
    const shuffledChoices = choices.sort(() => Math.random() - 0.5);

    setCurrentQuestion(correctItem);
    setOptions(shuffledChoices);
    setClickedChoices({});
    setHasFailedThisTurn(false);
    setIsTransitioning(false);
  }, [vocab]);

  // Trigger first question when vocab loads
  useEffect(() => {
    if (vocab.length > 0) {
      nextQuestion();
    }
  }, [vocab, nextQuestion]);

  const handleChoiceClick = (choice, index) => {
    if (isTransitioning || clickedChoices[index]) return;

    if (choice.isCorrect) {
      // Mark as correct
      setClickedChoices((prev) => ({ ...prev, [index]: 'correct' }));
      setIsTransitioning(true);

      // Scoring logic
      if (!hasFailedThisTurn) {
        setScore((s) => s + 1);
      }
      setTotalAnswered((t) => t + 1);

      // Wait 3 seconds and go to next question
      setTimeout(() => {
        nextQuestion();
      }, 3000);
    } else {
      // Mark as incorrect
      setClickedChoices((prev) => ({ ...prev, [index]: 'incorrect' }));
      
      // If first mistake on this question, register a failure and count it in total attempts
      if (!hasFailedThisTurn) {
        setHasFailedThisTurn(true);
        setTotalAnswered((t) => t + 1);
      }
    }
  };

  const handleEndSession = () => {
    setIsSummaryOpen(true);
  };

  const handleRestart = () => {
    setScore(0);
    setTotalAnswered(0);
    setIsSummaryOpen(false);
    nextQuestion();
  };

  const handleForceReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset cache:', e);
      window.location.reload();
    }
  };

  const successRate = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;

  if (vocab.length === 0 || !currentQuestion) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto' }}>
        <p>Chargement du vocabulaire...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header info */}
      <div className="header glass-panel">
        <div className="title-container">
          <h1>LingoFlash</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="reload-vocab-button" onClick={handleForceReload} title="Force Reload Vocab">
            🔄
          </button>
          <div className="score-badge">
            Score: {successRate}%
          </div>
        </div>
      </div>

      {/* Main Flashcard display */}
      <div className="card-container glass-panel">
        <div className="flashcard">
          <span className="flashcard-label">Traduisez le mot</span>
          <h2 className="flashcard-word">{currentQuestion.word}</h2>
        </div>
      </div>

      {/* Choices section */}
      <div className="choices-grid">
        {options.map((choice, idx) => {
          const status = clickedChoices[idx];
          const btnClass = `choice-button ${status || ''} ${isTransitioning ? 'disabled' : ''}`;
          return (
            <button
              key={choice.id}
              className={btnClass}
              onClick={() => handleChoiceClick(choice, idx)}
              disabled={isTransitioning || status === 'incorrect'}
            >
              {choice.picture ? (
                <img src={choice.picture} alt="Translation representation" />
              ) : (
                choice.text
              )}
            </button>
          );
        })}
      </div>

      {/* End session option */}
      <div className="action-area">
        <button className="end-button" onClick={handleEndSession}>
          End Session
        </button>
      </div>

      {/* End Session Summary Modal */}
      {isSummaryOpen && (
        <div className="overlay">
          <div className="glass-panel summary-card">
            <h2 className="summary-title">Félicitations!</h2>
            <div className="stats-circle">
              <span className="percentage">{successRate}%</span>
              <span className="label">Précision</span>
            </div>
            <div className="stats-detail">
              <div className="stat-item">
                <span className="stat-val correct-val">{score}</span>
                <span className="stat-lbl">Corrects</span>
              </div>
              <div className="stat-item">
                <span className="stat-val total-val">{totalAnswered}</span>
                <span className="stat-lbl">Total</span>
              </div>
            </div>
            <button className="restart-button" onClick={handleRestart}>
              Recommencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
