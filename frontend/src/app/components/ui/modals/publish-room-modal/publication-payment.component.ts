import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-publication-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-payment.component.html',
  host: { style: 'display: contents' }
})
export class PublicationPaymentComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
