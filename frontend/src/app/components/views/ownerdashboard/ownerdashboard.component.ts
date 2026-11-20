import { Component, Inject, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomCatalogComponent } from '../roomcatalog/roomcatalog.component';
import { App } from '../../../app';
import { DashboardSidebarComponent } from '../dashboard/dashboard-sidebar.component';
import { VisitRequestsComponent } from '../dashboard/visit-requests.component';
import { OwnerStatsComponent } from './owner-stats.component';
import { OwnerPropertiesComponent } from './owner-properties.component';
import { OwnerRequestsComponent } from './owner-requests.component';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RoomCatalogComponent, DashboardSidebarComponent, OwnerStatsComponent, OwnerPropertiesComponent, OwnerRequestsComponent, VisitRequestsComponent],
  templateUrl: './ownerdashboard.component.html',
  styleUrls: ['./ownerdashboard.component.css', './owner-dashboard-1.css', './owner-dashboard-2.css', './owner-dashboard-3.css', '../dashboard/dashboard-theme.css'],
  encapsulation: ViewEncapsulation.None
})
export class OwnerDashboardComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
