import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/training.models';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-select',
  templateUrl: './user-select.component.html',
  styleUrl: './user-select.component.scss',
  imports: [FormsModule,DatePipe, CommonModule]
})
export class UserSelectComponent {
  private userService = inject(UserService);
  
  @Output() userSelected = new EventEmitter<void>();
  
  users = this.userService.users;
  currentUser = this.userService.currentUser;
  newUserName = '';

  selectUser(user: User): void {
    this.userService.selectUser(user);
    this.userSelected.emit(); // Emit event when user is selected
  }

  createUser(): void {
    if (this.newUserName.trim()) {
      const newUser = this.userService.createUser(this.newUserName);
      this.userService.selectUser(newUser);
      this.userSelected.emit(); // Emit event when new user is created and selected
      this.newUserName = '';
    }
  }

  deleteUser(user: User, event: Event): void {
    event.stopPropagation();
    this.userService.deleteUser(user.id);
  }
}