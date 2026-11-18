import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';
import { RoomType } from '../../../core/models';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css', './property-detail-styles-1.css']
})
export class PropertyDetailComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  roomTypeLabel(type: RoomType): string {
    return {
      SINGLE: 'Habitación individual',
      DOUBLE: 'Habitación doble',
      SUITE: 'Suite',
      SHARED: 'Habitación compartida'
    }[type];
  }
}
