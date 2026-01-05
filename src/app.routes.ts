
import { Routes } from '@angular/router';
import { authGuard } from './app/core/guards/auth.guard';
import { adminGuard } from './app/core/guards/admin.guard';
import { kycGuard } from './app/core/guards/kyc.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./app/pages/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./app/pages/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./app/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard, kycGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./app/pages/admin/god-mode.component').then(c => c.GodModeComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'kyc-onboarding',
    loadComponent: () => import('./app/pages/kyc-onboarding/kyc-onboarding.component').then(c => c.KycOnboardingComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
