import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../../app';

@Component({
  selector: 'app-room-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-detail-modal.component.html',
  styleUrls: []
})
export class RoomDetailModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
