
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-kyc-modal',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div class="w-full max-w-lg p-8 space-y-6 bg-[#0F0F11] border border-blue-500/20 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.1)]">
        
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4">
            <svg class="w-6 h-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-white tracking-tight">Identity Verification</h2>
          <p class="text-zinc-400 text-sm">Mandatory KYC is required to activate your Neo-Bank account.</p>
        </div>

        <form [formGroup]="kycForm" (ngSubmit)="onSubmit()" class="space-y-6 mt-8">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-mono text-blue-400/80 uppercase tracking-wider mb-2">Legal Full Name</label>
              <input formControlName="displayName" type="text" 
                class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600"
                placeholder="e.g. Johnathan Doe">
            </div>

            <div>
              <label class="block text-xs font-mono text-blue-400/80 uppercase tracking-wider mb-2">Mobile Number</label>
              <input formControlName="phoneNumber" type="tel" 
                class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600"
                placeholder="+91 98765 43210">
            </div>
          </div>

          @if (error()) {
            <div class="p-3 rounded bg-red-900/20 border border-red-500/30 text-red-400 text-sm text-center">
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="kycForm.invalid || loading()"
            class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            @if (loading()) {
              <span class="animate-pulse">Verifying Identity...</span>
            } @else {
              <span>Complete Verification</span>
            }
          </button>
        </form>
        
        <p class="text-xs text-center text-zinc-600">
          Your data is encrypted and stored securely according to Neo-Bank banking regulations.
        </p>
      </div>
    </div>
  `
})
export class KycModalComponent {
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  // FIX: Explicitly cast the result of inject(FormBuilder) to FormBuilder to resolve a type inference issue where it was being treated as 'unknown'. This ensures the 'group' method is available and the form is correctly typed.
  kycForm = (inject(FormBuilder) as FormBuilder).group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]]
  });

  async onSubmit() {
    if (this.kycForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { displayName, phoneNumber } = this.kycForm.value;
      await this.authService.submitKYC(displayName!, phoneNumber!);
      // Modal closes automatically because parent component observes kycStatus
    } catch (e: any) {
      this.error.set('Verification failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
