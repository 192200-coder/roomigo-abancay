import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../../app';

@Component({
  selector: 'app-owner-delete-room-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-delete-room-modal.component.html',
  styleUrls: []
})
export class OwnerDeleteRoomModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
