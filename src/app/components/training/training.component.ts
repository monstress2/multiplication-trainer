import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { TrainingService } from '../../services/training.service';
import { MathProblem } from '../../models/training.models';
import { TRAINING_CONFIG } from '../../config/training-config';
import { ResultsComponent } from "../results/results.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrls: ['./training.component.scss'],
  imports: [ResultsComponent, FormsModule]
})
export class TrainingComponent implements OnInit, OnDestroy {
  @ViewChild('answerInput') answerInput!: ElementRef;
  private cdr = inject(ChangeDetectorRef);
  
  currentProblem: MathProblem | null = null;
  userAnswer: string = '';
  showFeedback: boolean = false;
  feedbackMessage: string = '';
  feedbackClass: string = '';
  showCorrectAnswer: boolean = false;
  progress: { current: number; total: number } = { current: 0, total: 0 };
  stats: { correct: number; incorrect: number } = { correct: 0, incorrect: 0 };
  
  private subscriptions: Subscription[] = [];
  private answerTimeout: any;

  constructor(private trainingService: TrainingService) {}
 ngOnInit(): void {
    this.trainingService.startTraining();
    this.updateData();
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }
  
  private updateData(): void {
    this.currentProblem = this.trainingService.getCurrentProblem();
    this.updateProgress();
    this.updateStats();
    
    // Принудительное обновление представления
    this.cdr.detectChanges();
  }

  blurInput(): void {
    if (this.answerInput) {
      this.answerInput.nativeElement.blur();
    }
  }
  focusInput(): void {
    if (this.answerInput) {
      this.answerInput.nativeElement.focus();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.checkAnswer();
    }
  }

  onInputChange(): void {
    // Автопроверка при вводе нужного количества цифр
    if (this.userAnswer.length >= 2) {
      clearTimeout(this.answerTimeout);
      this.answerTimeout = setTimeout(() => {
        this.checkAnswer();
      }, TRAINING_CONFIG.INPUT_DEBOUNCE_TIME);
    }
  }

  checkAnswer(): void {
    this.blurInput();
    console.log(this.userAnswer);
    if (!this.currentProblem || !this.userAnswer) return;

    const answer = parseInt(this.userAnswer, 10);
    if (isNaN(answer)) return;

    const result = this.trainingService.checkAnswer(answer);
    
    // Обновляем статистику
    if (result.isCorrect) {
      this.stats.correct++;
      this.showFeedbackMessage('Правильно! ✅', 'success');
    } else {
      this.stats.incorrect++;
      this.showFeedbackMessage(`Неправильно! ❌ Правильный ответ: ${result.correctAnswer}`, 'danger');
    }

    this.cdr.detectChanges();
    // Переход к следующему вопросу
    setTimeout(() => {
      console.log("next");
      this.trainingService.nextProblem();
      this.userAnswer = '';
      this.updateData();
      this.focusInput();
    }, TRAINING_CONFIG.NEXT_PROBLEM_DELAY);

    setTimeout(() => {
      this.showFeedback = false;
      this.showCorrectAnswer = false;
      this.cdr.detectChanges();
    }, TRAINING_CONFIG.FEEDBACK_DISPLAY_TIME);

  }

showFeedbackMessage(message: string, type: string): void {
    this.feedbackMessage = message;
    this.feedbackClass = `alert-${type}`;
    this.showFeedback = true;
    
    // Принудительное обновление для отображения feedback
    this.cdr.detectChanges();
  }


  updateProgress(): void {
    this.progress = this.trainingService.getProgress();
  }

  updateStats(): void {
    const results = this.trainingService.getResults();
    this.stats = {
      correct: results.correctAnswers,
      incorrect: results.incorrectAnswers
    };
  }

  stopTraining(): void {
    this.trainingService.stopTraining();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    clearTimeout(this.answerTimeout);
  }
}