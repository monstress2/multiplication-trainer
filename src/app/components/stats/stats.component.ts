import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { StatsService } from '../../services/stats.service';
import { DailyStats, UserStats } from '../../models/training.models';
import { OrderByPipe } from "../../pipes/order-by.pipe";

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
  imports: [CommonModule, FormsModule, OrderByPipe]
})
export class StatsComponent implements OnInit {
  private userService = inject(UserService);
  private statsService = inject(StatsService);
  
  currentUser = this.userService.currentUser;
  availableDates: string[] = [];
  selectedDate: string = '';
  stats: DailyStats | null = null;
  userStats: UserStats | null = null;

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