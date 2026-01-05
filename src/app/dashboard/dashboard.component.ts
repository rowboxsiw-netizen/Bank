
import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <!-- Top Bar -->
      <header class="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div class="flex items-center space-x-3">
          <svg class="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 7L12 12L22 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 12V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          <span class="text-lg font-semibold text-gray-800">Premium Bank</span>
        </div>
        <div class="flex items-center space-x-4">
          @if (currentUser()) {
            <div class="text-right">
              <p class="text-sm font-medium text-gray-800">{{ currentUser()?.displayName }}</p>
              <p class="text-xs text-gray-500">{{ userUPI() }}</p>
            </div>
            <button (click)="logout()" class="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
              Logout
            </button>
          }
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div class="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 space-y-8">
            <!-- Balance Section -->
            <div>
              <div class="flex items-center justify-between">
                <h2 class="text-base font-medium text-gray-500">Total Balance</h2>
                <button (click)="toggleBalanceVisibility()" class="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                   @if (showBalance()) {
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243a3 3 0 01-4.243-4.243" />
                    </svg>
                   } @else {
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                   }
                </button>
              </div>

              <div class="mt-4">
                @if (showBalance()) {
                  <p class="text-5xl font-bold tracking-tight text-gray-900">
                    {{ userBalance() | currency:'INR':'symbol':'1.2-2' }}
                  </p>
                } @else {
                  <p class="text-5xl font-bold tracking-tight text-gray-900">
                    <span class="tracking-widest">₹••••••</span>
                  </p>
                }
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="pt-6 border-t border-gray-200">
                <div class="flex items-center space-x-4">
                    <button class="w-full px-6 py-3 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Add Money
                    </button>
                    <button class="w-full px-6 py-3 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                      Send Money
                    </button>
                </div>
            </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  showBalance = signal(false);

  userBalance = computed(() => this.authService.currentUser()?.balance ?? 0);
  userUPI = computed(() => this.authService.currentUser()?.upiId ?? 'Not Set');

  toggleBalanceVisibility(): void {
    this.showBalance.update(value => !value);
  }

  logout() {
    this.authService.logout();
  }
}
