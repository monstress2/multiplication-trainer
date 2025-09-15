import { Component, signal } from '@angular/core';
import { TrainingSettings } from './models/training.models';
import { RouterOutlet } from '@angular/router';
import { SettingsComponent } from "./components/settings/settings.component";
import { TrainingComponent } from "./components/training/training.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SettingsComponent, TrainingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('multiplication-trainer');

  currentView: 'settings' | 'training' = 'settings';
  trainingSettings = signal<TrainingSettings | null>(null);

  onStartTraining(settings: TrainingSettings): void {
    this.trainingSettings.set(settings);
    this.currentView = 'training';
  }

  onTrainingFinished(): void {
    this.currentView = 'settings';
  }

}

