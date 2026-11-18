import { Component, Inject, forwardRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomCatalogComponent } from '../roomcatalog/roomcatalog.component';
import { App } from '../../../app';
import { DashboardSidebarComponent } from '../dashboard/dashboard-sidebar.component';
import { AdminWalletsComponent } from './admin-wallets.component';
import { AdminReportsComponent } from './admin-reports.component';
import { AdminPendingComponent } from './admin-pending.component';
import { AdminCrudComponent } from './admin-crud.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RoomCatalogComponent, DashboardSidebarComponent, AdminWalletsComponent, AdminReportsComponent, AdminPendingComponent, AdminCrudComponent],
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.css', './admin-dashboard-1.css', './admin-dashboard-2.css', './admin-dashboard-3.css', '../dashboard/dashboard-theme.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
