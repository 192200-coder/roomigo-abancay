import { RoomCatalogComponent } from '../roomcatalog/roomcatalog.component';
import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [RoomCatalogComponent, CommonModule, FormsModule],
  templateUrl: './tenantdashboard.component.html'
})
export class TenantDashboardComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
