
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center min-h-screen bg-black">
      <div class="w-full max-w-md p-8 space-y-8 bg-[#111] border border-zinc-800 rounded-lg">
        <div>
          <h2 class="mt-6 text-3xl font-extrabold text-center text-white">Create your account</h2>
          <p class="mt-2 text-sm text-center text-zinc-400">And receive a ₹50.00 sign-up bonus!</p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4 rounded-md shadow-sm">
            <div>
              <label for="email-address" class="sr-only">Email address</label>
              <input id="email-address" type="email" autocomplete="email" required
                     class="relative block w-full px-3 py-2 text-white bg-zinc-900 border border-zinc-700 placeholder-zinc-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Email address" formControlName="email">
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input id="password" type="password" autocomplete="new-password" required
                     class="relative block w-full px-3 py-2 text-white bg-zinc-900 border border-zinc-700 placeholder-zinc-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Password" formControlName="password">
            </div>
             <div>
              <label for="upi-id" class="sr-only">UPI ID</label>
              <input id="upi-id" type="text" autocomplete="off" required
                     class="relative block w-full px-3 py-2 text-white bg-zinc-900 border border-zinc-700 placeholder-zinc-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                     placeholder="Enter your UPI ID" formControlName="upiId">
            </div>
          </div>

          <div>
            <button type="submit" [disabled]="loading() || registerForm.invalid"
                    class="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed">
              @if (loading()) {
                <svg class="w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <span>Create Account</span>
              }
            </button>
          </div>
        </form>
        <p class="mt-4 text-sm text-center text-zinc-400">
            Already have an account? 
            <a routerLink="/login" class="font-medium text-blue-500 hover:text-blue-400">Sign In</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(false);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    upiId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)]]
  });

  async onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    const { email, password, upiId } = this.registerForm.value;

    try {
      await this.authService.register(email!, password!, upiId!);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      alert(error.message); // Generic alert as requested
    } finally {
      this.loading.set(false);
    }
  }
}
