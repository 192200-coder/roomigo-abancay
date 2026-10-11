import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-edit-location-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-location-modal.component.html',
  styleUrls: []
})
export class EditLocationModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
