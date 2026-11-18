import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-admin-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-crud.component.html',
  host: { style: 'display: contents' }
})
export class AdminCrudComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
