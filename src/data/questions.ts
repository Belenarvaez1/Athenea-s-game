import type { Question } from "@/types/game";

export const QUESTIONS: Question[] = [
  {
    id: "default-1",
    text: "What is the capital of France?",
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: "London", correct: false },
      { text: "Berlin", correct: false },
      { text: "Paris", correct: true },
      { text: "Madrid", correct: false },
    ],
  },
  {
    id: "default-2",
    text: "Which planet is known as the Red Planet?",
    timeLimit: 15,
    points: 1000,
    answers: [
      { text: "Venus", correct: false },
      { text: "Mars", correct: true },
      { text: "Jupiter", correct: false },
      { text: "Saturn", correct: false },
    ],
  },
  {
    id: "default-3",
    text: "How many sides does a hexagon have?",
    timeLimit: 10,
    points: 1000,
    answers: [
      { text: "5", correct: false },
      { text: "7", correct: false },
      { text: "8", correct: false },
      { text: "6", correct: true },
    ],
  },
  {
    id: "default-4",
    text: "What is 12 × 8?",
    timeLimit: 15,
    points: 1000,
    answers: [
      { text: "96", correct: true },
      { text: "86", correct: false },
      { text: "108", correct: false },
      { text: "84", correct: false },
    ],
  },
];
