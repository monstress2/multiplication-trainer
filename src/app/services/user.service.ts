import { Injectable, signal } from '@angular/core';
import { TrainingSettings, User } from '../models/training.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USERS_KEY = 'users';
  private readonly CURRENT_USER_KEY = 'current_user';
  
  users = signal<User[]>([]);
  currentUser = signal<User | null>(null);

  constructor(private storageService: StorageService) {
    this.loadUsers();
    this.loadCurrentUser();
  }

  resetUserSettings(userId: string): void {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;

    const defaultSettings: TrainingSettings = {
      selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      timeMode: false,
      duration: 1,
      problemCount: 10,
      singleAttempt: false,
      showAnswerAfterDelay: false,
      showAnswerDelay: 3
    };

    const updatedUser: User = {
      ...user,
      settings: defaultSettings
    };

    this.currentUser.set(updatedUser);
    this.storageService.setItem(this.CURRENT_USER_KEY, updatedUser);

    // Обновляем пользователя в списке
    const updatedUsers = this.users().map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    this.users.set(updatedUsers);
    this.storageService.setItem(this.USERS_KEY, updatedUsers);
  }
  
  private loadUsers(): void {
    const defaultUsers: User[] = [];
    const users = this.storageService.getItem<User[]>(this.USERS_KEY, defaultUsers);
    this.users.set(users.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt)
    })));
  }

  private loadCurrentUser(): void {
    const currentUser = this.storageService.getItem<User | null>(this.CURRENT_USER_KEY, null);
    if (currentUser) {
      this.currentUser.set({
        ...currentUser,
        createdAt: new Date(currentUser.createdAt)
      });
    }
  }

  createUser(name: string): User {
    const newUser: User = {
      id: this.generateId(),
      name: name.trim(),
      createdAt: new Date(),
      settings: {
        selectedNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        timeMode: false,
        duration: 1,
        problemCount: 10,
        singleAttempt: false,
        showAnswerAfterDelay: false,
        showAnswerDelay: 3
      }
    };

    const updatedUsers = [...this.users(), newUser];
    this.users.set(updatedUsers);
    this.storageService.setItem(this.USERS_KEY, updatedUsers);
    
    return newUser;
  }

  selectUser(user: User): void {
    this.currentUser.set(user);
    this.storageService.setItem(this.CURRENT_USER_KEY, user);
  }

  logout(): void {
    this.currentUser.set(null);
    this.storageService.removeItem(this.CURRENT_USER_KEY);
  }

  updateUserSettings(settings: TrainingSettings): void {
    const currentUser = this.currentUser();
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      settings: { ...settings }
    };

    this.currentUser.set(updatedUser);
    this.storageService.setItem(this.CURRENT_USER_KEY, updatedUser);

    // Обновляем пользователя в списке
    const updatedUsers = this.users().map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    this.users.set(updatedUsers);
    this.storageService.setItem(this.USERS_KEY, updatedUsers);
  }

  deleteUser(userId: string): boolean {
    const userToDelete = this.users().find(user => user.id === userId);
    if (!userToDelete) return false;

    if (!confirm(`Удалить пользователя "${userToDelete.name}"? Все данные будут потеряны.`)) {
      return false;
    }

    const updatedUsers = this.users().filter(user => user.id !== userId);
    this.users.set(updatedUsers);
    this.storageService.setItem(this.USERS_KEY, updatedUsers);

    // Если удаляем текущего пользователя - выходим
    if (this.currentUser()?.id === userId) {
      this.logout();
    }

    // Удаляем статистику пользователя
    this.storageService.removeItem(`stats_${userId}`);

    return true;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}