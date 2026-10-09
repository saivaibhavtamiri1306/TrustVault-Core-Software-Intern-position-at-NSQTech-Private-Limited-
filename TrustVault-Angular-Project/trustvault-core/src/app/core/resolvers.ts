import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ApiService } from './api.service';
import { Candidate } from './models';

/** Fetches the candidates BEFORE the pipeline page opens, so it never flashes an empty state. */
export const candidatesResolver: ResolveFn<Candidate[]> = () => inject(ApiService).candidates();
