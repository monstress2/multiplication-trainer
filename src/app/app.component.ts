import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSelectComponent } from './components/user-select/user-select.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TrainingComponent } from './components/training/training.component';
import { ResultsComponent } from './components/results/results.component';
import { StatsComponent } from './components/stats/stats.component';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    UserSelectComponent,
    SettingsComponent,
    TrainingComponent,
    ResultsComponent,
    StatsComponent
  ]
})
export class AppComponent {
  private userService = inject(UserService);
  
  currentView: 'user-select' | 'settings' | 'training' | 'results' | 'stats' = 'user-select';
  currentUser = this.userService.currentUser;

  ngOnInit(): void {
    // Если есть текущий пользователь, показываем настройки
    if (this.currentUser()) {
      this.currentView = 'settings';
    }
  }

  onUserSelected(): void {
    this.currentView = 'settings';
  }

  onStartTraining(): void {
    this.currentView = 'training';
  }

  onTrainingFinished(): void {
    this.currentView = 'results';
  }

  onShowStats(): void {
    this.currentView = 'stats';
  }

  onBackToSettings(): void {
    this.currentView = 'settings';
  }

  onLogout(): void {
    this.userService.logout();
    this.currentView = 'user-select';
  }
}