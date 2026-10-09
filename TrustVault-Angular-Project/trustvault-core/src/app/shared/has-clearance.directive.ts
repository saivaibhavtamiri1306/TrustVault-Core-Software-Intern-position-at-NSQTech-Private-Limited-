import { Directive, TemplateRef, ViewContainerRef, effect, inject, input, untracked } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { UserRole } from '../core/models';

/** Structural directive: <button *hasClearance="'Admin'"> only exists in the DOM for admins. */
@Directive({ selector: '[hasClearance]', standalone: true })
export class HasClearanceDirective {
  role = input.required<UserRole>({ alias: 'hasClearance' });
  private tpl = inject<TemplateRef<unknown>>(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);

  constructor() {
    effect(() => {
      const allowed = this.auth.user()?.role === this.role();
      untracked(() => {
        this.vcr.clear();
        if (allowed) this.vcr.createEmbeddedView(this.tpl);
      });
    });
  }
}
