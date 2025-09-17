import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { StatsService } from '../../services/stats.service';
import { DailyStats, ProblemStat } from '../../models/training.models';
import { OrderByPipe } from '../../pipes/order-by.pipe';

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  imports: [CommonModule, FormsModule]
})
export class StatsComponent implements OnInit {
  private userService = inject(UserService);
  private statsService = inject(StatsService);
  
  currentUser = this.userService.currentUser;
  availableDates: string[] = [];
  selectedDate: string = '';
  stats: DailyStats | null = null;
  userStats: any = null;
  
  sortConfig: SortConfig = { column: '', direction: 'asc' };
  sortedProblems: ProblemStat[] = [];

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    const user = this.currentUser();
    if (!user) return;

    this.userStats = this.statsService.getStats(user.id);
    this.availableDates = this.statsService.getAvailableDates(user.id);
    
    if (this.availableDates.length > 0) {
      this.selectedDate = this.availableDates[0];
      this.selectDate(this.selectedDate);
    }
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    this.stats = this.userStats?.dailyStats[date] || null;
    this.sortedProblems = this.stats?.problems ? [...this.stats.problems] : [];
    this.sortConfig = { column: '', direction: 'asc' };
  }

  sortTable(column: string): void {
    if (this.sortConfig.column === column) {
      this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortConfig = { column, direction: 'asc' };
    }

    this.sortedProblems.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (column) {
        case 'problem':
          valueA = `${a.a}x${a.b}`;
          valueB = `${b.a}x${b.b}`;
          break;
        case 'attempts':
          valueA = a.totalAttempts;
          valueB = b.totalAttempts;
          break;
        case 'correct':
          valueA = a.correctAttempts;
          valueB = b.correctAttempts;
          break;
        case 'accuracy':
          valueA = a.correctAttempts / a.totalAttempts;
          valueB = b.correctAttempts / b.totalAttempts;
          break;
        case 'time':
          valueA = a.averageTime;
          valueB = b.averageTime;
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string') {
        return this.sortConfig.direction === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else {
        return this.sortConfig.direction === 'asc' 
          ? valueA - valueB
          : valueB - valueA;
      }
    });
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'bi bi-arrow-down-up';
    }
    return this.sortConfig.direction === 'asc' 
      ? 'bi bi-arrow-up' 
      : 'bi bi-arrow-down';
  }

  clearStats(): void {
    const user = this.currentUser();
    if (!user || !confirm('Очистить всю статистику? Это действие нельзя отменить.')) return;

    this.statsService.clearStats(user.id);
    this.loadStats();
  }

  clearDayStats(): void {
    const user = this.currentUser();
    if (!user || !this.selectedDate || !confirm('Очистить статистику за выбранный день?')) return;

    this.statsService.clearStats(user.id, this.selectedDate);
    this.loadStats();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}