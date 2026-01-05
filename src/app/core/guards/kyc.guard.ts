
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const kycGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && user.kycStatus === 'verified') {
    return true;
  }
  
  // If user is logged in but KYC is pending, redirect to the onboarding page.
  router.navigate(['/kyc-onboarding']);
  return false;
};
