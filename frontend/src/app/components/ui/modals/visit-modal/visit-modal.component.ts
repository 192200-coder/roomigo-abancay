import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

/** Pedido de visita a una publicación en venta (reemplaza a la reserva). */
@Component({
  selector: 'app-visit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-modal.component.html',
  styleUrls: ['./visit-modal.component.css']
})
export class VisitModalComponent {
  /** Horarios sugeridos: el propietario confirma o propone otro. */
  readonly timeSlots = ['09:00', '10:30', '12:00', '15:00', '16:30', '18:00'];

  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
