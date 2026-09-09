import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [questionCount, setQuestionCount] = useState(0);
  const questionCountRef = useRef(0);

  // Load vocab configuration
  useEffect(() => {
    const basePath = import.meta.env.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    fetch(`${cleanBase}vocab/fr.json?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setVocab(data);
      })
      .catch((err) => console.error('Failed to load vocabulary config:', err));
  }, []);

  // Generate a new flashcard question
  const nextQuestion = useCallback((overrideCount) => {
    if (vocab.length < 4) return;

    const count = typeof overrideCount === 'number' ? overrideCount : questionCountRef.current;
    // 10 times French prompt -> 10 times English prompt -> repeat
    const isFrenchPrompt = Math.floor(count / 10) % 2 === 0;

    // Pick a random word from vocab as the correct answer
    const correctIdx = Math.floor(Math.random() * vocab.length);
    const correctItem = vocab[correctIdx];

    // Pick 3 unique incorrect answers from the rest of the vocab
    const pool = vocab.filter((_, idx) => idx !== correctIdx);
    const incorrectItems = [];
    while (incorrectItems.length < 3) {
      const randIdx = Math.floor(Math.random() * pool.length);
      const item = pool[randIdx];
      const isDuplicate = isFrenchPrompt
        ? item.translation.toLowerCase().trim() === correctItem.translation.toLowerCase().trim() ||
          incorrectItems.some((x) => x.translation.toLowerCase().trim() === item.translation.toLowerCase().trim())
        : item.word.toLowerCase().trim() === correctItem.word.toLowerCase().trim() ||
          incorrectItems.some((x) => x.word.toLowerCase().trim() === item.word.toLowerCase().trim());

      if (!isDuplicate) {
        incorrectItems.push(item);
      }
    }

    // Determine correct representation (text translation or picture if exists)
    // 50% chance to show picture if it exists, only when prompt is in French
    const usePicture = isFrenchPrompt && !!correctItem.picture && Math.random() < 0.5;

    // Map correct and incorrect items into options
    const choices = [
      {
        id: 'correct',
        text: isFrenchPrompt ? (usePicture ? null : correctItem.translation) : correctItem.word,
        picture: usePicture ? correctItem.picture : null,
        isCorrect: true,
      },
      ...incorrectItems.map((item, idx) => ({
        id: `incorrect-${idx}`,
        text: isFrenchPrompt ? item.translation : item.word,
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
      nextQuestion(0);
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

      const nextCount = questionCountRef.current + 1;
      questionCountRef.current = nextCount;
      setQuestionCount(nextCount);

      // Wait 3 seconds and go to next question
      setTimeout(() => {
        nextQuestion(nextCount);
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
    questionCountRef.current = 0;
    setQuestionCount(0);
    setScore(0);
    setTotalAnswered(0);
    setIsSummaryOpen(false);
    nextQuestion(0);
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
  const isFrenchPrompt = Math.floor(questionCount / 10) % 2 === 0;
  const roundProgress = (questionCount % 10) + 1;

  if (vocab.length === 0 || !currentQuestion) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', margin: 'auto' }}>
        <p>Chargement du vocabulaire...</p>
      </div>
    );
  }

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
    const basePath = import.meta.env.BASE_URL || './';
    const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}${cleanPath}`;
  };

  return (
    <div className="app-container">
      {/* Top Header info */}
      <div className="header glass-panel">
        <div className="title-container">
          <h1>LingoFlash</h1>
          <span className="mode-indicator">
            {isFrenchPrompt ? '🇫🇷 ➔ 🇬🇧' : '🇬🇧 ➔ 🇫🇷'} ({roundProgress}/10)
          </span>
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
          <span className="flashcard-label">
            {isFrenchPrompt ? 'Traduisez en anglais' : 'Traduisez en français'}
          </span>
          <h2 className="flashcard-word">
            {isFrenchPrompt ? currentQuestion.word : currentQuestion.translation}
          </h2>
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
                <img src={getImageUrl(choice.picture)} alt="Translation representation" />
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
