import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-tenant-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-home.component.html',
  styleUrl: './tenant-home.component.css'
})
export class TenantHomeComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  get booking() {
    return this.app.tenantBookings().find(booking => booking.status === 'CONFIRMED');
  }
}
