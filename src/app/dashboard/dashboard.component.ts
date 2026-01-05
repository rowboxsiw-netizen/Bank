
import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-screen bg-[#0a0a0a] text-zinc-200 font-sans">
      <!-- Top Bar -->
      <header class="h-16 flex-shrink-0 bg-black border-b border-zinc-800 flex items-center justify-between px-6">
        <div class="flex items-center space-x-3">
          <svg class="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 7L12 12L22 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <span class="text-lg font-semibold">Neo-Bank</span>
        </div>
        <div class="flex items-center space-x-4">
          @if (currentUser()) {
            <span class="text-sm text-zinc-400">Welcome, {{ currentUser()?.email }}</span>
            <button (click)="logout()" class="px-3 py-1.5 text-sm text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700">
              Logout
            </button>
          }
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center p-8">
        <div class="w-full max-w-lg bg-black border border-zinc-800 rounded-lg p-8 text-center">
          <h2 class="text-sm font-medium text-zinc-400">Total Balance</h2>
          
          <p class="mt-2 text-5xl font-semibold tracking-tight" 
             [class]="(userBalance() > 0) ? 'text-green-400' : 'text-zinc-200'">
            {{ userBalance() | currency:'INR':'symbol':'1.2-2' }}
          </p>
          
          <p class="mt-4 text-base text-zinc-500">
            Linked UPI: {{ userUPI() }}
          </p>
          
          <div class="mt-8">
            <button class="w-full max-w-xs px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500">
              Add Money
            </button>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  userBalance = computed(() => this.authService.currentUser()?.balance ?? 0);
  userUPI = computed(() => this.authService.currentUser()?.upiId ?? 'Not Set');

  logout() {
    this.authService.logout();
  }
}
