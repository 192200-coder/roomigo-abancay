import { Component, Inject, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomCatalogComponent } from '../roomcatalog/roomcatalog.component';
import { App } from '../../../app';
import { DashboardSidebarComponent } from '../dashboard/dashboard-sidebar.component';
import { VisitRequestsComponent } from '../dashboard/visit-requests.component';
import { TenantHomeComponent } from './tenant-home.component';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, RoomCatalogComponent, DashboardSidebarComponent, TenantHomeComponent, VisitRequestsComponent],
  templateUrl: './tenantdashboard.component.html',
  styleUrls: ['./tenantdashboard.component.css', './tenant-dashboard-1.css', './tenant-dashboard-2.css', '../dashboard/dashboard-theme.css'],
  encapsulation: ViewEncapsulation.None
})
export class TenantDashboardComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
