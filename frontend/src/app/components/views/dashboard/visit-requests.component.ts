import { Component, Inject, forwardRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';
import { VisitRequest, VisitRequestStatus } from '../../../core/models';

/**
 * Pedidos de visita a publicaciones en venta.
 * - owner: los recibidos; puede confirmar o declinar (con una nota opcional).
 * - tenant: los enviados; puede cancelar y ve el teléfono del propietario al confirmarse.
 */
@Component({
  selector: 'app-visit-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-requests.component.html',
  styleUrl: './visit-requests.component.css'
})
export class VisitRequestsComponent {
  readonly role = input.required<'owner' | 'tenant'>();

  /** Nota que el propietario escribe antes de responder, por pedido. */
  notes: Record<number, string> = {};

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  get visits(): VisitRequest[] {
    return this.role() === 'owner' ? this.app.ownerVisits() : this.app.tenantVisits();
  }

  statusLabel(status: VisitRequestStatus): string {
    return { PENDING: 'Por confirmar', CONFIRMED: 'Confirmada', DECLINED: 'No disponible', CANCELLED: 'Cancelada' }[status];
  }

  respond(visit: VisitRequest, status: VisitRequestStatus): void {
    this.app.updateVisitStatus(visit, status, this.notes[visit.id]);
  }

  /** Enlace de WhatsApp con un mensaje listo (solo dígitos, con prefijo de Perú si falta). */
  whatsappUrl(phone: string | null | undefined, title: string): string | null {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length < 9) return null;
    const number = digits.length === 9 ? '51' + digits : digits;
    const text = encodeURIComponent(`Hola, te escribo por la visita a «${title}» agendada en RoomiGo.`);
    return `https://wa.me/${number}?text=${text}`;
  }
}
