import { Routes } from '@angular/router';
import { candidatesResolver } from '../core/resolvers';

/** Lazy-loaded admin area (guarded by adminGuard in app.routes.ts). */
export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: 'users', data: { anim: 'users' }, loadComponent: () => import('./users.component').then(m => m.UsersComponent) },
  { path: 'pipeline', data: { anim: 'pipeline' }, resolve: { candidates: candidatesResolver }, loadComponent: () => import('./pipeline.component').then(m => m.PipelineComponent) },
  { path: 'audit', data: { anim: 'audit' }, loadComponent: () => import('./audit.component').then(m => m.AuditComponent) },
];
