import { Injectable, signal, computed } from '@angular/core';
import { TrainingSettings, MathProblem, TrainingResults } from '../models/training.models';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  private readonly STORAGE_KEY = 'multiplication_trainer_settings';
  
  private settings = signal<TrainingSettings>(this.loadSettings());
  private currentProblem = signal<MathProblem | null>(null);
  private problems = signal<MathProblem[]>([]);
  private currentProblemIndex = signal(0);
  private trainingStartTime: Date | null = null;

  private loadSettings(): TrainingSettings {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
    
    // Настройки по умолчанию
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

  private saveSettings(settings: TrainingSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }

  getSettings(): TrainingSettings {
    return this.settings();
  }

  updateSettings(settings: TrainingSettings): void {
    this.settings.set({ ...settings });
    this.saveSettings(settings);
  }

  resetSettings(): void {
    const defaultSettings: TrainingSettings = {
      selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      timeMode: false,
      duration: 1,
      problemCount: 10,
      singleAttempt: false,
      showAnswerAfterDelay: false,
      showAnswerDelay: 3
    };
    
    this.settings.set(defaultSettings);
    this.saveSettings(defaultSettings);
  }

  generateProblem(): MathProblem {
    const selectedNumbers = this.settings().selectedNumbers;
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

    const totalProblems = this.settings().timeMode ? 100 : this.settings().problemCount;
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
      this.currentProblem.set(null);
    }
  }

  getResults(): TrainingResults {
    const completedProblems = this.problems().filter(p => p.endTime);
    const correctAnswers = completedProblems.filter(p => p.isCorrect).length;
    const totalTime = completedProblems.reduce((total, problem) => {
      if (problem.startTime && problem.endTime) {
        return total + (problem.endTime.getTime() - problem.startTime.getTime()) / 1000;
      }
      return total;
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
    this.currentProblem.set(null);
  }
}