import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../../app';
import { PaymentStatus } from '../../../../core/models';

/** Nombres legibles de los medios de pago de Mercado Pago Perú. */
const PAYMENT_METHODS: Record<string, string> = {
  yape: 'Yape',
  visa: 'Visa',
  master: 'Mastercard',
  amex: 'American Express',
  diners: 'Diners Club',
  debvisa: 'Visa Débito',
  debmaster: 'Mastercard Débito',
  pagoefectivo_atm: 'PagoEfectivo',
  paycash: 'PayCash',
  account_money: 'Saldo de Mercado Pago',
  MERCADO_PAGO: 'Mercado Pago'
};

@Component({
  selector: 'app-mp-receipt-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mp-receipt-modal.component.html',
  styleUrls: ['./mp-receipt-modal.component.css']
})
export class MpReceiptModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  title(status: PaymentStatus): string {
    return {
      COMPLETED: '¡Pago acreditado!',
      PENDING: 'Pago pendiente',
      FAILED: 'Pago no aprobado',
      REFUNDED: 'Pago reembolsado'
    }[status];
  }

  subtitle(status: PaymentStatus): string {
    return {
      COMPLETED: 'Mercado Pago confirmó tu pago.',
      PENDING: 'Si pagaste con PagoEfectivo o en efectivo, se acreditará cuando completes el pago. Te avisaremos.',
      FAILED: 'No se realizó ningún cobro. Puedes intentarlo de nuevo con otro medio de pago.',
      REFUNDED: 'Mercado Pago devolvió el importe de esta operación.'
    }[status];
  }

  statusLabel(status: PaymentStatus): string {
    return { COMPLETED: 'Acreditado', PENDING: 'Pendiente', FAILED: 'Rechazado', REFUNDED: 'Reembolsado' }[status];
  }

  methodLabel(method?: string): string {
    return (method && PAYMENT_METHODS[method]) || method || 'Mercado Pago';
  }
}
