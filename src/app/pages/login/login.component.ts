
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-50">
      <div class="w-full max-w-md p-8 space-y-8 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 class="mt-6 text-3xl font-bold text-center text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-sm text-center text-gray-600">
            Welcome back to your Premium Bank
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4 rounded-md">
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input id="email-address" type="email" autocomplete="email" required
                     class="relative block w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Email address" formControlName="email">
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input id="password" type="password" autocomplete="current-password" required
                     class="relative block w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 placeholder-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Password" formControlName="password">
            </div>
          </div>

          @if (errorMessage()) {
            <div class="p-3 text-sm text-center text-red-700 bg-red-100 border border-red-200 rounded-md">
              {{ errorMessage() }}
            </div>
          }

          <div>
            <button type="submit" [disabled]="loading() || loginForm.invalid"
                    class="relative flex justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed">
              @if (loading()) {
                <svg class="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <span>Sign in</span>
              }
            </button>
          </div>
        </form>
         <p class="mt-4 text-sm text-center text-gray-600">
            Don't have an account? 
            <a routerLink="/register" class="font-medium text-blue-600 hover:text-blue-500">
              Sign Up
            </a>
          </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);

  // FIX: Explicitly cast the result of inject(FormBuilder) to FormBuilder to resolve a type inference issue where it was being treated as 'unknown'. This ensures the 'group' method is available and the form is correctly typed.
  loginForm = (inject(FormBuilder) as FormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An unknown error occurred.');
    } finally {
      this.loading.set(false);
    }
  }
}
