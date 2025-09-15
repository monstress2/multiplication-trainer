export interface TrainingSettings {
  selectedNumbers: number[];
  timeMode: boolean;
  duration: number; // в минутах
  problemCount: number;
  singleAttempt: boolean;
  showAnswerAfterDelay: boolean;
  showAnswerDelay: number; // в секундах
}

export interface MathProblem {
  a: number;
  b: number;
  answer: number;
  userAnswer?: number;
  isCorrect?: boolean;
  startTime?: Date;
  endTime?: Date;
}

export interface TrainingResults {
  totalProblems: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalTime: number; // в секундах
  averageTime: number; // в секундах
}