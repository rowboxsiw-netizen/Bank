
import { Routes } from '@angular/router';
import { authGuard } from './app/core/guards/auth.guard';
import { adminGuard } from './app/core/guards/admin.guard';

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
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./app/pages/admin/admin-dashboard.component').then(c => c.AdminDashboardComponent),
    canActivate: [adminGuard]
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
