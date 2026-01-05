
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink]
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // FIX: Explicitly cast the result of inject(FormBuilder) to FormBuilder to resolve a type inference issue where it was being treated as 'unknown'. This ensures the 'group' method is available and the form is correctly typed.
  registerForm = (inject(FormBuilder) as FormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    upiId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)]]
  });

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email, password, upiId } = this.registerForm.value;

    try {
      await this.authService.registerUser(email!, password!, upiId!);
      this.successMessage.set('Account created! ₹50 Bonus credited. Redirecting...');
      setTimeout(() => this.router.navigate(['/dashboard']), 2000);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'An unknown error occurred.');
    } finally {
      this.loading.set(false);
    }
  }
}
