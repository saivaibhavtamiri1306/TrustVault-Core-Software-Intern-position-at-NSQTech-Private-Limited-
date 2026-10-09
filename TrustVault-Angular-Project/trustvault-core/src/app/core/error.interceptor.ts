import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** An expired/invalid session on any API call sends the user back to the login screen. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService), router = inject(Router);
  return next(req).pipe(catchError((e: HttpErrorResponse) => {
    if (e.status === 401 && auth.user() && !req.url.endsWith('/auth/login')) {
      auth.logout();
      router.navigateByUrl('/login');
    }
    return throwError(() => e);
  }));
};
