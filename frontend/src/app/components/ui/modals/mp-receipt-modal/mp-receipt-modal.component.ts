import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../../app';

@Component({
  selector: 'app-mp-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mp-receipt-modal.component.html'
})
export class MpReceiptModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
