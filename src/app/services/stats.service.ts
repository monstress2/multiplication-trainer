import { Injectable } from '@angular/core';
import { DailyStats, UserStats, ProblemStat, MathProblem } from '../models/training.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  constructor(private storageService: StorageService) {}

  private getStatsKey(userId: string): string {
    return `stats_${userId}`;
  }

  getStats(userId: string): UserStats {
    const defaultStats: UserStats = {
      userId,
      dailyStats: {}
    };
    
    return this.storageService.getItem<UserStats>(this.getStatsKey(userId), defaultStats);
  }

  saveStats(userId: string, stats: UserStats): void {
    this.storageService.setItem(this.getStatsKey(userId), stats);
  }

  addTrainingResult(userId: string, problems: MathProblem[]): void {
    const userStats = this.getStats(userId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!userStats.dailyStats[today]) {
      userStats.dailyStats[today] = this.createEmptyDailyStats(today);
    }

    const dailyStats = userStats.dailyStats[today];
    
    problems.forEach(problem => {
      if (problem.endTime && problem.startTime && problem.timeSpent !== undefined) {
        const normalizedProblem = this.normalizeProblem(problem);
        
        let problemStat = dailyStats.problems.find(p => 
          p.a === normalizedProblem.a && p.b === normalizedProblem.b
        );

        if (!problemStat) {
          problemStat = this.createEmptyProblemStat(normalizedProblem.a, normalizedProblem.b);
          dailyStats.problems.push(problemStat);
        }

        problemStat.totalAttempts++;
        if (problem.isCorrect) {
          problemStat.correctAttempts++;
        }
        problemStat.totalTime += problem.timeSpent;
        problemStat.averageTime = problemStat.totalTime / problemStat.totalAttempts;
      }
    });

    // Обновляем общую статистику за день
    const completedProblems = problems.filter(p => p.endTime);
    dailyStats.totalProblems += completedProblems.length;
    dailyStats.correctAnswers += completedProblems.filter(p => p.isCorrect).length;
    dailyStats.accuracy = dailyStats.totalProblems > 0 ? 
      (dailyStats.correctAnswers / dailyStats.totalProblems) * 100 : 0;
    
    const totalTime = completedProblems.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    dailyStats.averageTime = completedProblems.length > 0 ? 
      totalTime / completedProblems.length : 0;

    this.saveStats(userId, userStats);
  }

  clearStats(userId: string, date?: string): void {
    if (date) {
      // Очистка за конкретный день
      const userStats = this.getStats(userId);
      delete userStats.dailyStats[date];
      this.saveStats(userId, userStats);
    } else {
      // Очистка всей статистики
      const emptyStats: UserStats = {
        userId,
        dailyStats: {}
      };
      this.saveStats(userId, emptyStats);
    }
  }

  getAvailableDates(userId: string): string[] {
    const userStats = this.getStats(userId);
    return Object.keys(userStats.dailyStats).sort().reverse();
  }

  private normalizeProblem(problem: MathProblem): { a: number; b: number } {
    // Приводим a*b и b*a к одинаковому виду (a всегда меньше или равно b)
    const a = Math.min(problem.a, problem.b);
    const b = Math.max(problem.a, problem.b);
    return { a, b };
  }

  private createEmptyDailyStats(date: string): DailyStats {
    return {
      date,
      totalProblems: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      problems: []
    };
  }

  private createEmptyProblemStat(a: number, b: number): ProblemStat {
    return {
      a,
      b,
      totalAttempts: 0,
      correctAttempts: 0,
      totalTime: 0,
      averageTime: 0
    };
  }
}