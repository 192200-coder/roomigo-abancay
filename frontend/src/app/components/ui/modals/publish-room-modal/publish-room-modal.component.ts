import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-publish-room-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publish-room-modal.component.html',
  styleUrls: ['./publish-room-modal.component.css']
})
export class PublishRoomModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
