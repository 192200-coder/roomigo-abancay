import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-owner-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-properties.component.html',
  styleUrl: './owner-properties.component.css',
  host: { style: 'display: contents' }
})
export class OwnerPropertiesComponent {
  query = '';
  status = 'ALL';
  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  get rooms() {
    return this.app.myProperties().flatMap(property => this.app.getRoomsForProperty(property.id));
  }

  get filteredRooms() {
    const query = this.query.trim().toLocaleLowerCase('es');
    return this.rooms.filter(room =>
      `${room.title} ${room.propertyAddress} RG-${room.id}`.toLocaleLowerCase('es').includes(query) &&
      (this.status === 'ALL' || room.status === this.status || this.status === 'RENTED' && room.status === 'OCCUPIED'));
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      AVAILABLE: 'Disponible', PENDING_APPROVAL: 'En revisión', RENTED: 'Ocupado',
      OCCUPIED: 'Ocupado', REJECTED: 'Rechazado', MAINTENANCE: 'Mantenimiento'
    };
    return labels[status] || status;
  }
}
