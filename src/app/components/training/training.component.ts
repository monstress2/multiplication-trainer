import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { TrainingService } from '../../services/training.service';
import { TRAINING_CONFIG } from '../../config/training-config';
import { ResultsComponent } from "../results/results.component";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrl: './training.component.scss',
  imports: [ResultsComponent, FormsModule]
})
export class TrainingComponent implements OnInit, OnDestroy {
  @ViewChild('answerInput') answerInput!: ElementRef;
  @Output() trainingFinished = new EventEmitter<void>();
  
  private trainingService = inject(TrainingService);
  private cdr = inject(ChangeDetectorRef);
  
  currentProblem = this.trainingService.getCurrentProblem();
  userAnswer: string = '';
  showFeedback: boolean = false;
  feedbackMessage: string = '';
  feedbackClass: string = '';
  showCorrectAnswer: boolean = false;
  progress = this.trainingService.getProgress();
  stats = { correct: 0, incorrect: 0 };
  
  private answerTimeout: any;
  private correctAnswerTimeout: any;

  ngOnInit(): void {
    this.trainingService.startTraining();
    this.updateData();
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  private updateData(): void {
    this.currentProblem = this.trainingService.getCurrentProblem();
    this.progress = this.trainingService.getProgress();
    this.updateStats();
    
    // Принудительное обновление представления
    this.cdr.detectChanges();
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

  // onInputChange(): void {
  //   if (this.userAnswer?.length >= 2) {
  //     clearTimeout(this.answerTimeout);
  //     this.answerTimeout = setTimeout(() => {
  //       this.checkAnswer();
  //     }, TRAINING_CONFIG.INPUT_DEBOUNCE_TIME);
  //   }
  // }

  blurInput(): void {
    if (this.answerInput) {
      this.answerInput.nativeElement.blur();
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

    // Принудительное обновление перед таймаутом
    this.cdr.detectChanges();

    // Переход к следующему вопросу с принудительным обновлением
    // setTimeout(() => {
    //   this.trainingService.nextProblem();
    //   this.userAnswer = '';
    //   this.showFeedback = false;
    //   this.showCorrectAnswer = false;
    //   this.updateData();
    //   this.focusInput();

    //   // Если тренировка завершена
    //   if (!this.trainingService.getCurrentProblem()) {
    //     this.trainingFinished.emit();
    //   }
    // }, TRAINING_CONFIG.NEXT_PROBLEM_DELAY);


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
      // Если тренировка завершена
      if (!this.trainingService.getCurrentProblem()) {
        this.trainingFinished.emit();
      }

    }, TRAINING_CONFIG.FEEDBACK_DISPLAY_TIME);
    
  }

  showFeedbackMessage(message: string, type: string): void {
    this.feedbackMessage = message;
    this.feedbackClass = `alert-${type}`;
    this.showFeedback = true;
    
    // Принудительное обновление для отображения feedback
    this.cdr.detectChanges();
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
    this.trainingFinished.emit();
  }

  ngOnDestroy(): void {
    clearTimeout(this.answerTimeout);
    clearTimeout(this.correctAnswerTimeout);
  }
}