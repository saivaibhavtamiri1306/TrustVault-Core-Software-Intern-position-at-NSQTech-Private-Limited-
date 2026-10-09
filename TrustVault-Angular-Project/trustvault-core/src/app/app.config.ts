import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { authInterceptor } from './core/auth.interceptor';
import { cacheInterceptor } from './core/cache.interceptor';
import { errorInterceptor } from './core/error.interceptor';
import { mockBackendInterceptor } from './core/mock-backend.interceptor';
import { USE_MOCK } from './core/api.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    // order matters: errors -> auth header -> offline cache -> (mock) backend
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor, cacheInterceptor, ...(USE_MOCK ? [mockBackendInterceptor] : [])])),
    // App load: restore the signed-in user (User Service) before the first route renders
    { provide: APP_INITIALIZER, multi: true, deps: [AuthService], useFactory: (a: AuthService) => () => firstValueFrom(a.restore()) },
  ],
};
