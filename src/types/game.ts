export type AnswerOption = {
  text: string;
  correct?: boolean;
};

export type Question = {
  id: string;
  text: string;
  timeLimit: number;
  points: number;
  answers: [AnswerOption, AnswerOption, AnswerOption, AnswerOption];
};

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  lastCorrect: boolean | null;
  lastPoints: number;
};

export type GamePhase =
  | 'lobby'
  | 'starting'
  | 'question'
  | 'answered'
  | 'results'
  | 'leaderboard'
  | 'finished';

export type QuestionEvent = Question & { index: number; total: number };

export type ResultsEvent = {
  correctIndex: number;
  answerCounts: number[];
  players: Player[];
};
