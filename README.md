# Lingo.Next

Lingo.Next is a French vocabulary trainer built with React and Vite. It presents flashcard-style questions that ask the learner to translate between French and English, then scores each answer and repeats missed words later to reinforce learning.

## What it does

- Shows a vocabulary word or phrase in one language and asks for the matching translation in the other
- Alternates question direction between French → English and English → French
- Generates multiple-choice answers with one correct option and three distractors
- Tracks score, total answered questions, and progress through each round
- Repeats missed words after a short delay using a lightweight spaced-repetition pattern
- Uses browser speech synthesis to pronounce French words aloud
- Supports image-backed vocabulary items for a few entries
- Displays a final summary screen with accuracy and a restart option

## Project structure

- [src/App.jsx](src/App.jsx): main flashcard logic, quiz flow, scoring, retries, and audio
- [public/vocab/fr.json](public/vocab/fr.json): vocabulary dataset used by the app
- [src/index.css](src/index.css): styling and mobile-ready layout
- [public/manifest.json](public/manifest.json): PWA manifest metadata
- [public/sw.js](public/sw.js): service worker for caching and installability

## How it works

The app loads a vocabulary list from the JSON file and creates a new question at a time. Each question is selected from the set of available words, and incorrect answers are queued for later review. This helps turn the app into a small language-learning loop instead of a simple multiple-choice quiz.

The quiz also alternates direction every 10 questions, which keeps the practice balanced between understanding French prompts and producing translations back into French.

## Development

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```
