import { Component, Inject, forwardRef, input } from '@angular/core';
import { App } from '../../../app';

type PanelRole = 'tenant' | 'owner' | 'admin';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.css',
  host: { style: 'display: contents' }
})
export class DashboardSidebarComponent {
  readonly role = input.required<PanelRole>();
  readonly labels = { tenant: 'Inquilino', owner: 'Propietario', admin: 'Administrador' };
  readonly bookingFilters = ['CONFIRMED', 'PENDING', 'REJECTED'] as const;

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  overview(): void {
    if (this.role() === 'tenant') this.app.tenantFilter.set('ALL');
    if (this.role() === 'owner') this.app.ownerTab.set('properties');
    if (this.role() === 'admin') {
      this.app.adminFilterStatus = 'ALL';
      this.app.adminTab.set('crud');
    }
  }
}
