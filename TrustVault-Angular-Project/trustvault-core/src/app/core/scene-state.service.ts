import { Injectable, signal } from '@angular/core';

/** Lets the login screen tell the 3D background to switch to "scanning" mode. */
@Injectable({ providedIn: 'root' })
export class SceneStateService {
  readonly isScanning = signal(false);
}
