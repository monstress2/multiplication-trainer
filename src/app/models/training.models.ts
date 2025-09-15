// Добавим интерфейс для приоритетной задачи
export interface PriorityProblem {
  a: number;
  b: number;
  priority: number; // чем выше приоритет, тем чаще показывается
  consecutiveCorrect: number; // количество подряд правильных ответов
  lastAttemptTime?: number; // время последней попытки в секундах
  lastAttemptCorrect?: boolean; // был ли последний ответ правильным
}

export interface TrainingSettings {
  selectedNumbers: number[];
  timeMode: boolean;
  duration: number;
  problemCount: number;
  singleAttempt: boolean;
  showAnswerAfterDelay: boolean;
  showAnswerDelay: number;
}

export interface MathProblem {
  a: number;
  b: number;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  startTime?: Date;
  endTime?: Date;
  timeSpent?: number; // в секундах
}

export interface TrainingResults {
  totalProblems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTime: number;
}

export interface User {
  id: string;
  name: string;
  createdAt: Date;
  settings: TrainingSettings;
}

export interface ProblemStat {
  a: number;
  b: number;
  totalAttempts: number;
  correctAttempts: number;
  totalTime: number;
  averageTime: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalProblems: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  problems: ProblemStat[];
}

export interface UserStats {
  userId: string;
  dailyStats: { [date: string]: DailyStats };
}