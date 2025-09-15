import { Injectable, signal, inject } from '@angular/core';
import { TrainingSettings, MathProblem, TrainingResults } from '../models/training.models';
import { UserService } from './user.service';
import { StatsService } from './stats.service';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  private userService = inject(UserService);
  private statsService = inject(StatsService);
  
  private currentProblem = signal<MathProblem | null>(null);
  private problems = signal<MathProblem[]>([]);
  private currentProblemIndex = signal(0);
  private trainingStartTime: Date | null = null;

  getSettings(): TrainingSettings {
    const currentUser = this.userService.currentUser();
    return currentUser?.settings || this.getDefaultSettings();
  }

  updateSettings(settings: TrainingSettings): void {
    this.userService.updateUserSettings(settings);
  }

  private getDefaultSettings(): TrainingSettings {
    return {
      selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      timeMode: false,
      duration: 1,
      problemCount: 10,
      singleAttempt: false,
      showAnswerAfterDelay: false,
      showAnswerDelay: 3
    };
  }

  generateProblem(): MathProblem {
    const settings = this.getSettings();
    const selectedNumbers = settings.selectedNumbers;
    const a = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
    const b = Math.floor(Math.random() * 10) + 1;
    return {
      a,
      b,
      answer: a * b,
      startTime: new Date()
    };
  }

  startTraining(): void {
    this.problems.set([]);
    this.currentProblemIndex.set(0);
    this.trainingStartTime = new Date();

    const settings = this.getSettings();
    const totalProblems = settings.timeMode ? 100 : settings.problemCount;
    const newProblems: MathProblem[] = [];
    
    for (let i = 0; i < totalProblems; i++) {
      newProblems.push(this.generateProblem());
    }

    this.problems.set(newProblems);
    this.currentProblem.set(newProblems[0]);
  }

  checkAnswer(answer: number): { isCorrect: boolean; correctAnswer: number } {
    const currentIdx = this.currentProblemIndex();
    const currentProblems = this.problems();
    
    if (currentIdx >= currentProblems.length) {
      return { isCorrect: false, correctAnswer: 0 };
    }

    const currentProblem = { ...currentProblems[currentIdx] };
    currentProblem.endTime = new Date();
    currentProblem.userAnswer = answer;
    currentProblem.isCorrect = answer === currentProblem.answer;
    
    // Рассчитываем время, затраченное на ответ
    if (currentProblem.startTime && currentProblem.endTime) {
      currentProblem.timeSpent = (currentProblem.endTime.getTime() - currentProblem.startTime.getTime()) / 1000;
    }

    const updatedProblems = [...currentProblems];
    updatedProblems[currentIdx] = currentProblem;
    this.problems.set(updatedProblems);

    return {
      isCorrect: currentProblem.isCorrect,
      correctAnswer: currentProblem.answer
    };
  }

  nextProblem(): void {
    const nextIndex = this.currentProblemIndex() + 1;
    const currentProblems = this.problems();
    
    if (nextIndex < currentProblems.length) {
      this.currentProblemIndex.set(nextIndex);
      this.currentProblem.set(currentProblems[nextIndex]);
    } else {
      this.finishTraining();
    }
  }

  private finishTraining(): void {
    const currentUser = this.userService.currentUser();
    if (currentUser) {
      // Сохраняем статистику
      const completedProblems = this.problems().filter(p => p.endTime);
      this.statsService.addTrainingResult(currentUser.id, completedProblems);
    }
    
    this.currentProblem.set(null);
  }

  getResults(): TrainingResults {
    const completedProblems = this.problems().filter(p => p.endTime);
    const correctAnswers = completedProblems.filter(p => p.isCorrect).length;
    const totalTime = completedProblems.reduce((total, problem) => {
      return total + (problem.timeSpent || 0);
    }, 0);

    return {
      totalProblems: completedProblems.length,
      correctAnswers,
      incorrectAnswers: completedProblems.length - correctAnswers,
      accuracy: completedProblems.length > 0 ? (correctAnswers / completedProblems.length) * 100 : 0,
      totalTime,
      averageTime: completedProblems.length > 0 ? totalTime / completedProblems.length : 0
    };
  }

  getCurrentProblem(): MathProblem | null {
    return this.currentProblem();
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentProblemIndex() + 1,
      total: this.problems().length
    };
  }

  stopTraining(): void {
    this.finishTraining();
  }
}