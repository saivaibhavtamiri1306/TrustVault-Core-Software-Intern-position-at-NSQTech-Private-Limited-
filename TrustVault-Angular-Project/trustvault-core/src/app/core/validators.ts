import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { ApiService } from './api.service';

/** Async validator: waits 450 ms after typing stops, then asks the API whether the ID is taken. */
export function uniqueIdValidator(api: ApiService): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(450).pipe(
      switchMap(() => api.checkId(String(control.value))),
      map(r => (r.exists ? { idTaken: true } : null)),
      catchError(() => of(null)));
}
