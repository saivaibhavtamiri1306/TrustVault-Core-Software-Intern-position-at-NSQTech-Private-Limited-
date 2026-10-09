import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
  {
    path: '', canActivate: [authGuard],
    loadComponent: () => import('./shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', data: { anim: 'dashboard' }, loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'records', data: { anim: 'records' }, loadComponent: () => import('./records/records.component').then(m => m.RecordsComponent) },
      { path: 'admin', canActivate: [adminGuard], loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) },
    ],
  },
  { path: '**', redirectTo: '' },
];
