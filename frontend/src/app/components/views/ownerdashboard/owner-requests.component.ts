import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-owner-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-requests.component.html',
  host: { style: 'display: contents' }
})
export class OwnerRequestsComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
