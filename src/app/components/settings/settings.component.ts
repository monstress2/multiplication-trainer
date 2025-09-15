import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrainingSettings } from '../../models/training.models';
import { TrainingService } from '../../services/training.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [FormsModule, CommonModule]
})
export class SettingsComponent implements OnInit {
  @Output() startTraining = new EventEmitter<void>();

  private trainingService = inject(TrainingService);
  private userService = inject(UserService);
  
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  settings: TrainingSettings = {
    selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    timeMode: false,
    duration: 1,
    problemCount: 10,
    singleAttempt: false,
    showAnswerAfterDelay: false,
    showAnswerDelay: 3
  };

  ngOnInit(): void {
    // Загружаем сохраненные настройки при инициализации
    const savedSettings = this.trainingService.getSettings();
    this.settings = { ...savedSettings };
  }

  toggleNumber(number: number): void {
    const index = this.settings.selectedNumbers.indexOf(number);
    if (index > -1) {
      this.settings.selectedNumbers.splice(index, 1);
    } else {
      this.settings.selectedNumbers.push(number);
    }
    this.saveSettings();
  }

  isNumberSelected(number: number): boolean {
    return this.settings.selectedNumbers.includes(number);
  }

  selectAllNumbers(): void {
    this.settings.selectedNumbers = [...this.numbers];
    this.saveSettings();
  }

  deselectAllNumbers(): void {
    this.settings.selectedNumbers = [];
    this.saveSettings();
  }

  onSettingChange(): void {
    this.saveSettings();
  }

  resetSettings(): void {
    if (confirm('Вы уверены, что хотите сбросить настройки к значениям по умолчанию?')) {
      const defaultSettings: TrainingSettings = {
        selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        timeMode: false,
        duration: 1,
        problemCount: 10,
        singleAttempt: false,
        showAnswerAfterDelay: false,
        showAnswerDelay: 3
      };
      
      this.settings = { ...defaultSettings };
      this.saveSettings();
    }
  }

  private saveSettings(): void {
    this.trainingService.updateSettings({ ...this.settings });
  }

  onStart(): void {
    if (this.settings.selectedNumbers.length === 0) {
      alert('Выберите хотя бы одно число для тренировки');
      return;
    }

    if (this.settings.timeMode && this.settings.duration <= 0) {
      alert('Введите положительное время тренировки');
      return;
    }

    if (!this.settings.timeMode && this.settings.problemCount <= 0) {
      alert('Введите положительное количество задач');
      return;
    }

    this.saveSettings();
    this.startTraining.emit();
  }
}