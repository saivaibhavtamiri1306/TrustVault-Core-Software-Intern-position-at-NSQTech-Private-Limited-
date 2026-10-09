import { Pipe, PipeTransform } from '@angular/core';
import { Clearance } from '../core/models';

@Pipe({ name: 'clearance', standalone: true })
export class ClearancePipe implements PipeTransform {
  transform(level: Clearance): string {
    return level === 'Public' ? 'border-emerald-500/50 text-emerald-400'
      : level === 'Internal' ? 'border-brand-400/50 text-brand-400'
      : 'border-cyber-danger/50 text-cyber-danger';
  }
}
