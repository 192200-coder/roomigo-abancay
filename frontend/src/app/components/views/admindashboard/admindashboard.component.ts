import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';
import { RoomCatalogComponent } from '../roomcatalog/roomcatalog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RoomCatalogComponent],
  templateUrl: './admindashboard.component.html'
})
export class AdminDashboardComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
