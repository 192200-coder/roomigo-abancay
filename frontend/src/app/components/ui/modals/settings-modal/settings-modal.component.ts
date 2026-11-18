import { Component, Inject, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';
import { NotificationService } from '../../../../core/notification.service';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html'
})
export class SettingsModalComponent {
  readonly notifications = inject(NotificationService);

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  openNotifications(event: Event): void {
    event.stopPropagation(); // evita que el clic cierre el panel recién abierto
    this.app.closeSettingsModal();
    this.notifications.openPanel();
  }
}
