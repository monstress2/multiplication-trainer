import { Component, OnInit } from '@angular/core';
import { TrainingService } from '../../services/training.service';
import { TrainingResults } from '../../models/training.models';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  imports: [DecimalPipe]
})
export class ResultsComponent implements OnInit {
  results!: TrainingResults;

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.results = this.trainingService.getResults();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins} мин ${secs} сек`;
  }

  restart(): void {
    window.location.reload();
  }
}