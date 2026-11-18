import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-admin-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-pending.component.html',
  host: { style: 'display: contents' }
})
export class AdminPendingComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
