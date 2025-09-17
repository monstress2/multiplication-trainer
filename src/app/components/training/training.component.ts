import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, inject, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { TrainingService } from '../../services/training.service';
import { TRAINING_CONFIG } from '../../config/training-config';
import { ResultsComponent } from "../results/results.component";
import { FormsModule } from '@angular/forms';
import { TrainingSettings } from '../../models/training.models';
import { UserService } from '../../services/user.service';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-training',
  templateUrl: './training.component.html',
  styleUrl: './training.component.scss',
  imports: [ResultsComponent, FormsModule, DecimalPipe]
})
export class TrainingComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);

  @ViewChild('answerInput') answerInput!: ElementRef;
  @Output() trainingFinished = new EventEmitter<void>();
  
  private trainingService = inject(TrainingService);
  private cdr = inject(ChangeDetectorRef);
  private showAnswerTimeout: any;
  isAnswerShown = false;
  private attemptsCount = 0;
  
  currentProblem = this.trainingService.getCurrentProblem();
  userAnswer: string = '';
  showFeedback: boolean = false;
  feedbackMessage: string = '';
  feedbackTitle: string = '';
  feedbackClass: string = '';
  showCorrectAnswer: boolean = false;
  progress = this.trainingService.getProgress();
  stats = { correct: 0, incorrect: 0 };
  
  private answerTimeout: any;
  private correctAnswerTimeout: any;
  currentSettings!: TrainingSettings;

  ngOnInit(): void {
    this.currentSettings = this.getSettings() || this.getDefaultSettings();
    this.trainingService.startTraining();
    this.updateData();
  
    // Запускаем таймер показа ответа, если включена настройка
    if (this.currentSettings.showAnswerAfterDelay) {
      this.startAnswerTimer();
    }
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  startAnswerTime: Date = new Date();
  lastTotalSeconds: number = 0;
  showAnswerTimer: boolean = false;
  answerTimerInterval: any = undefined;

  private startAnswerTimer(): void {
  if (this.showAnswerTimeout) {
    clearTimeout(this.showAnswerTimeout);
  }
  
  this.startAnswerTime = new Date();
  this.showAnswerTimeout = setTimeout(() => {
    if (this.answerTimerInterval) clearInterval(this.answerTimerInterval);
    this.showAnswerTimer = false;

    this.answerTimerInterval = undefined;
    if (this.currentProblem && !this.currentProblem.endTime) {
      this.isAnswerShown = true;
      this.showCorrectAnswer = true;
      this.cdr.detectChanges();
      
      // Если включен singleAttempt, автоматически отправляем "пустой" ответ
      if (this.currentSettings.singleAttempt) {
        setTimeout(() => {
          this.submitAnswerAsIncorrect();
        }, 500);
      }
    }
  }, this.currentSettings.showAnswerDelay * 1000);
  
  this.showAnswerTimer = true;
  this.cdr.detectChanges();
  this.answerTimerInterval = setInterval(() => {
    this.lastTotalSeconds = this.currentSettings.showAnswerDelay - Math.ceil((new Date().valueOf() - this.startAnswerTime.valueOf())/100)/10;
    if (this.lastTotalSeconds <= 0){
      if (this.answerTimerInterval) clearInterval(this.answerTimerInterval);
      this.lastTotalSeconds = 0;
    }
    this.cdr.detectChanges();
  }, 100)
}

  private submitAnswerAsIncorrect(): void {
    if (!this.currentProblem) return;

    this.restoreInputFocus = false;
    this.blurInput();

    const result = this.trainingService.checkAnswer(NaN); // Отправляем NaN как неправильный ответ
    this.stats.incorrect++;
    this.showFeedbackMessage('Время вышло! ⏰', `${this.currentProblem.answer}`, 'warning');

    this.cdr.detectChanges();

    setTimeout(() => {
      this.trainingService.nextProblem();
      this.userAnswer = '';
      this.isAnswerShown = false;
      this.updateData();
      this.focusInput();

      if (!this.trainingService.getCurrentProblem()) {
        this.trainingFinished.emit();
      }
    }, TRAINING_CONFIG.NEXT_PROBLEM_DELAY);

    setTimeout(() => {
      this.showFeedback = false;
      this.cdr.detectChanges();
    }, TRAINING_CONFIG.SHOW_CORRECT_ANSWER_DELAY);
  }

  getSettings(): TrainingSettings | undefined {
    const currentUser = this.userService.currentUser();
    return currentUser?.settings ;
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

  private updateData(): void {
  this.currentProblem = this.trainingService.getCurrentProblem();
  if (this.currentProblem){
    this.currentProblem.startTime = new Date();
  }

  this.progress = this.trainingService.getProgress();
  this.updateStats();
  
  // Сбрасываем счетчик попыток и флаг показа ответа
  this.attemptsCount = 0;
  this.isAnswerShown = false;
  
  // Принудительное обновление представления
  this.cdr.detectChanges();
}

  // private updateData(): void {
  //   this.currentProblem = this.trainingService.getCurrentProblem();
  //   if (this.currentProblem){
  //     this.currentProblem.startTime = new Date();
  //   }

  //   this.progress = this.trainingService.getProgress();
  //   this.updateStats();
    
  //   // Принудительное обновление представления
  //   this.cdr.detectChanges();
  // }

  focusInput(): void {
    if (this.answerInput) {
      this.answerInput.nativeElement.focus();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isAnswerShown){
      this.showFeedback = false;
    }
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

  restoreInputFocus: boolean = true;
  oninputblur(){
    if (this.restoreInputFocus){
      setTimeout(() => {this.focusInput();}, 10);
    }
    this.restoreInputFocus = true;
  }
  
  checkAnswer(): void {
  if (!this.currentProblem || !this.userAnswer) return;

  // Если ответ уже был показан и включен singleAttempt, игнорируем ввод
  if (this.isAnswerShown && this.currentSettings.singleAttempt) {
    this.userAnswer = '';
    return;
  }

  this.showFeedback = false;
  this.cdr.detectChanges();

  this.restoreInputFocus = false;
  this.blurInput();

  const answer = parseInt(this.userAnswer, 10);
  if (isNaN(answer)) return;

  this.attemptsCount++;

  const result = this.trainingService.checkAnswer(answer);
  let feedbackDisplayTime;
  
  if (result.isCorrect) {
    this.stats.correct++;
    this.showFeedbackMessage('Правильно!', '✅', 'success');
    feedbackDisplayTime = TRAINING_CONFIG.SHOW_CORRECT_ANSWER_DELAY;
    
    // Переходим к следующему вопросу после правильного ответа
    this.moveToNextProblem(TRAINING_CONFIG.NEXT_PROBLEM_DELAY);
  } else {
    // Если включен singleAttempt и это первая попытка, или не включен singleAttempt
    if (!this.currentSettings.singleAttempt || this.attemptsCount === 1) {
      this.stats.incorrect++;
      this.showFeedbackMessage('Неправильно! ❌', `${result.correctAnswer}`, 'danger');
      feedbackDisplayTime = TRAINING_CONFIG.SHOW_WRONG_ANSWER_DELAY;
      
      // Если включен singleAttempt, переходим к следующему вопросу
      if (this.currentSettings.singleAttempt) {
        this.moveToNextProblem(feedbackDisplayTime);
      } else {
        this.userAnswer = '';

        // Если multiple attempts, даем возможность попробовать снова
      }
    }
  }
        if (!this.isAnswerShown){
          setTimeout(() => {
            this.showFeedback = false;
            this.focusInput();
            this.cdr.detectChanges();
          }, feedbackDisplayTime);
        }

  this.cdr.detectChanges();
}

private moveToNextProblem(delay: number): void {
  setTimeout(() => {
    this.trainingService.nextProblem();
    this.userAnswer = '';
//    this.showFeedback = false;
    this.showCorrectAnswer = false;
    this.isAnswerShown = false;
    this.attemptsCount = 0;
    this.updateData();
    
    // Перезапускаем таймер показа ответа для следующего вопроса
    if (this.currentSettings.showAnswerAfterDelay && this.trainingService.getCurrentProblem()) {
      this.startAnswerTimer();
    }
    
    this.focusInput();

    if (!this.trainingService.getCurrentProblem()) {
      this.trainingFinished.emit();
    }
  }, delay);
}
  // checkAnswer(): void {
  //   if (!this.currentProblem || !this.userAnswer) return;

  //   this.showFeedback = false;
  //   this.cdr.detectChanges();

  //   this.restoreInputFocus = false;
  //   this.blurInput();

  //   const answer = parseInt(this.userAnswer, 10);
  //   if (isNaN(answer)) return;

  //   const result = this.trainingService.checkAnswer(answer);
  //   let feedbackDisplayTime;
  //   // Обновляем статистику
  //   if (result.isCorrect) {
  //     this.stats.correct++;
  //     this.showFeedbackMessage('Правильно!','✅', 'success');
  //     feedbackDisplayTime = TRAINING_CONFIG.SHOW_WRONG_ANSWER_DELAY;
  //   } else {
  //     this.focusInput();
  //     this.stats.incorrect++;
  //     this.showFeedbackMessage('Неправильно! ❌', `${result.correctAnswer}`, 'danger');
  //     feedbackDisplayTime = TRAINING_CONFIG.SHOW_CORRECT_ANSWER_DELAY;
  //   }

  //   // Принудительное обновление перед таймаутом
  //   this.cdr.detectChanges();

  //   // Переход к следующему вопросу с принудительным обновлением
  //   // setTimeout(() => {
  //   //   this.trainingService.nextProblem();
  //   //   this.userAnswer = '';
  //   //   this.showFeedback = false;
  //   //   this.showCorrectAnswer = false;
  //   //   this.updateData();
  //   //   this.focusInput();

  //   //   // Если тренировка завершена
  //   //   if (!this.trainingService.getCurrentProblem()) {
  //   //     this.trainingFinished.emit();
  //   //   }
  //   // }, TRAINING_CONFIG.NEXT_PROBLEM_DELAY);


  //  this.cdr.detectChanges();
  //   // Переход к следующему вопросу

  //   setTimeout(() => {
  //     this.trainingService.nextProblem();
  //     this.userAnswer = '';
  //     this.updateData();
  //     this.focusInput();
  //   }, TRAINING_CONFIG.NEXT_PROBLEM_DELAY);

  //   setTimeout(() => {
  //     this.showFeedback = false;
  //     this.cdr.detectChanges();
  //     // Если тренировка завершена
  //     if (!this.trainingService.getCurrentProblem()) {
  //       this.trainingFinished.emit();
  //     }

  //   }, feedbackDisplayTime);

  //   // setTimeout(() => {
  //   //   // this.showCorrectAnswer = false;
  //   //   this.cdr.detectChanges();
  //   //   // Если тренировка завершена
  //   //   if (!this.trainingService.getCurrentProblem()) {
  //   //     this.trainingFinished.emit();
  //   //   }

  //   // }, TRAINING_CONFIG.SHOW_CORRECT_ANSWER_DELAY);
    
  // }

  showFeedbackMessage(title: string, message: string, type: string): void {
    this.feedbackTitle = title;
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
    clearTimeout(this.showAnswerTimeout);
  }
}