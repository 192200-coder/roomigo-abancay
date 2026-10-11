import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-owner-edit-room-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './owner-edit-room-modal.component.html',
  styleUrls: []
})
export class OwnerEditRoomModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
