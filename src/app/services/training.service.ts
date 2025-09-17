import { Injectable, signal, inject } from '@angular/core';
import { TrainingSettings, MathProblem, TrainingResults, PriorityProblem } from '../models/training.models';
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
  private recentProblems: { a: number; b: number }[] = [];
  private problemPriorityMap: Map<string, PriorityProblem> = new Map();
  private readonly MAX_RECENT_PROBLEMS = 5; // Количество последних задач для избежания повторений

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
      showAnswerAfterDelay: true,
      showAnswerDelay: 8
    };
  }

  private generateProblemKey(a: number, b: number): string {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}x${max}`;
  }

  private updateProblemPriority(problem: MathProblem, isCorrect: boolean, timeSpent: number): void {
    const key = this.generateProblemKey(problem.a, problem.b);
    const existing = this.problemPriorityMap.get(key) || {
      a: Math.min(problem.a, problem.b),
      b: Math.max(problem.a, problem.b),
      priority: 0,
      consecutiveCorrect: 0
    };

    if (isCorrect) {
      existing.consecutiveCorrect++;
      // Уменьшаем приоритет за правильные ответы, но не ниже 0
      existing.priority = Math.max(0, existing.priority - 1);
    } else {
      existing.consecutiveCorrect = 0;
      // Увеличиваем приоритет за неправильные ответы
      existing.priority += 3;
    }

    // Увеличиваем приоритет за долгие ответы (> 5 секунд)
    if (timeSpent > 5) {
      existing.priority += 2;
    }

    existing.lastAttemptTime = timeSpent;
    existing.lastAttemptCorrect = isCorrect;

    this.problemPriorityMap.set(key, existing);
  }

  private getAvailableProblems(selectedNumbers: number[]): PriorityProblem[] {
    const availableProblems: PriorityProblem[] = [];
    
    // Генерируем все возможные комбинации
    for (const a of selectedNumbers) {
      for (let b = 1; b <= 10; b++) {
        const key = this.generateProblemKey(a, b);
        const existing = this.problemPriorityMap.get(key);
        
        // Пропускаем задачи с 10+ подряд правильными ответами
        if (existing && existing.consecutiveCorrect >= 10) {
          continue;
        }

        // Понижаем приоритет примитивных задач (1*b, 2*b, 10*b)
        const left = Math.min(a, b);
        const isPrimitive = left === 1 || left === 2 || left === 10;
        
        const basePriority = isPrimitive ? -2 : 0;
        
        availableProblems.push(existing || {
          a: Math.min(a, b),
          b: Math.max(a, b),
          priority: basePriority,
          consecutiveCorrect: 0
        });
      }
    }

    return availableProblems;
  }

  private selectNextProblem(selectedNumbers: number[]): { a: number; b: number } {
    const availableProblems = this.getAvailableProblems(selectedNumbers);
    
    if (availableProblems.length === 0) {
      // Если нет доступных задач, возвращаем случайную
      const a = selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)];
      const b = Math.floor(Math.random() * 10) + 1;
      return { a, b };
    }

    // Создаем веса для задач на основе приоритета
    const weightedProblems: { problem: PriorityProblem; weight: number }[] = [];
    
    for (const problem of availableProblems) {
      // Базовый вес = приоритет + 1 (чтобы все были положительными)
      let weight = problem.priority + 1;
      
      // Увеличиваем вес для задач, которых не было в последних
      const isRecent = this.recentProblems.some(recent => 
        this.generateProblemKey(recent.a, recent.b) === 
        this.generateProblemKey(problem.a, problem.b)
      );
      
      if (!isRecent) {
        weight *= 2;
      }
      
      weightedProblems.push({ problem, weight });
    }

    // Создаем массив для взвешенного случайного выбора
    const selectionArray: PriorityProblem[] = [];
    for (const { problem, weight } of weightedProblems) {
      for (let i = 0; i < weight; i++) {
        selectionArray.push(problem);
      }
    }

    // Выбираем случайную задачу из взвешенного массива
    const randomIndex = Math.floor(Math.random() * selectionArray.length);
    const selectedProblem = selectionArray[randomIndex];

    // Обновляем список последних задач
    this.recentProblems.push({
      a: selectedProblem.a,
      b: selectedProblem.b
    });
    
    // Ограничиваем размер списка последних задач
    if (this.recentProblems.length > this.MAX_RECENT_PROBLEMS) {
      this.recentProblems.shift();
    }

    return selectedProblem;
  }

  generateProblem(): MathProblem {
    const settings = this.getSettings();
    const { a, b } = this.selectNextProblem(settings.selectedNumbers);
    
    return {
      a,
      b,
      answer: a * b
    };
  }

  startTraining(): void {
  this.problemPriorityMap.clear();
  this.recentProblems = [];
  this.problems.set([]);
  this.currentProblemIndex.set(0);
  this.trainingStartTime = new Date();

  const settings = this.getSettings();
  const totalProblems = settings.timeMode ? 100 : settings.problemCount;
  const newProblems: MathProblem[] = [];
  
  for (let i = 0; i < totalProblems; i++) {
    const problem = this.generateProblem();
    // Устанавливаем startTime только для первой задачи
    if (i === 0) {
      problem.startTime = new Date();
    }
    newProblems.push(problem);
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
  currentProblem.userAnswer = isNaN(answer) ? undefined : answer; // Сохраняем undefined для автоматических ответов
  currentProblem.isCorrect = !isNaN(answer) && answer === currentProblem.answer;
  
  if (currentProblem.startTime && currentProblem.endTime) {
    currentProblem.timeSpent = (currentProblem.endTime.getTime() - currentProblem.startTime.getTime()) / 1000;
    
    this.updateProblemPriority(
      currentProblem, 
      currentProblem.isCorrect, 
      currentProblem.timeSpent
    );
  }

  const updatedProblems = [...currentProblems];
  updatedProblems[currentIdx] = currentProblem;
  this.problems.set(updatedProblems);

  return {
    isCorrect: currentProblem.isCorrect,
    correctAnswer: currentProblem.answer
  };
}

  // checkAnswer(answer: number): { isCorrect: boolean; correctAnswer: number } {
  //   const currentIdx = this.currentProblemIndex();
  //   const currentProblems = this.problems();
    
  //   if (currentIdx >= currentProblems.length) {
  //     return { isCorrect: false, correctAnswer: 0 };
  //   }

  //   const currentProblem = { ...currentProblems[currentIdx] };
  //   currentProblem.endTime = new Date();
  //   currentProblem.userAnswer = answer;
  //   currentProblem.isCorrect = answer === currentProblem.answer;
    
  //   if (currentProblem.startTime && currentProblem.endTime) {
  //     currentProblem.timeSpent = (currentProblem.endTime.getTime() - currentProblem.startTime.getTime()) / 1000;
      
  //     this.updateProblemPriority(
  //       currentProblem, 
  //       currentProblem.isCorrect, 
  //       currentProblem.timeSpent
  //     );
  //   }

  //   const updatedProblems = [...currentProblems];
  //   updatedProblems[currentIdx] = currentProblem;
  //   this.problems.set(updatedProblems);

  //   return {
  //     isCorrect: currentProblem.isCorrect,
  //     correctAnswer: currentProblem.answer
  //   };
  // }

  nextProblem(): void {
    const nextIndex = this.currentProblemIndex() + 1;
    const currentProblems = this.problems();

    if (nextIndex < currentProblems.length) {
      this.currentProblemIndex.set(nextIndex);

      const updatedProblems = [...currentProblems];
      updatedProblems[nextIndex] = {
        ...updatedProblems[nextIndex],
        startTime: new Date()
      };

      this.problems.set(updatedProblems);
      this.currentProblem.set(updatedProblems[nextIndex]);

      // const nextProblem = { ...currentProblems[nextIndex] };
      // nextProblem.startTime = new Date();
      // this.currentProblem.set(nextProblem);
    } else {
      this.finishTraining();
    }
  }

  private finishTraining(): void {
    const currentUser = this.userService.currentUser();
    if (currentUser) {
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