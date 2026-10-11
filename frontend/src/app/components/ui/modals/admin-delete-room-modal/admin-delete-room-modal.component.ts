import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../../app';

@Component({
  selector: 'app-admin-delete-room-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-delete-room-modal.component.html',
  styleUrls: []
})
export class AdminDeleteRoomModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
