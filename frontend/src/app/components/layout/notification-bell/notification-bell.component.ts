import { Component, ElementRef, HostListener, Inject, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';
import { NotificationService } from '../../../core/notification.service';
import { AppNotification, NotificationType } from '../../../core/models';

type Destination = { tab: 'my-bookings' | 'owner-panel' | 'visits'; ownerTab?: 'requests' | 'properties' };

const ICONS: Record<NotificationType, string> = {
  BOOKING_REQUEST: 'fa-envelope-open-text',
  BOOKING_APPROVED: 'fa-circle-check',
  BOOKING_REJECTED: 'fa-circle-xmark',
  BOOKING_CANCELLED: 'fa-ban',
  PAYMENT_CONFIRMED: 'fa-wallet',
  PAYMENT_RECEIVED: 'fa-sack-dollar',
  PUBLICATION_PAID: 'fa-receipt',
  ROOM_APPROVED: 'fa-house-circle-check',
  ROOM_REJECTED: 'fa-triangle-exclamation',
  REVIEW_RECEIVED: 'fa-star',
  VISIT_REQUESTED: 'fa-calendar-plus',
  VISIT_CONFIRMED: 'fa-calendar-check',
  VISIT_DECLINED: 'fa-calendar-xmark',
  VISIT_CANCELLED: 'fa-calendar-minus'
};

/** A qué sección lleva cada aviso al hacer clic. */
const DESTINATIONS: Record<NotificationType, Destination> = {
  BOOKING_REQUEST: { tab: 'owner-panel', ownerTab: 'requests' },
  BOOKING_CANCELLED: { tab: 'owner-panel', ownerTab: 'requests' },
  PAYMENT_RECEIVED: { tab: 'owner-panel', ownerTab: 'requests' },
  PUBLICATION_PAID: { tab: 'owner-panel', ownerTab: 'properties' },
  ROOM_APPROVED: { tab: 'owner-panel', ownerTab: 'properties' },
  ROOM_REJECTED: { tab: 'owner-panel', ownerTab: 'properties' },
  REVIEW_RECEIVED: { tab: 'owner-panel', ownerTab: 'properties' },
  BOOKING_APPROVED: { tab: 'my-bookings' },
  BOOKING_REJECTED: { tab: 'my-bookings' },
  PAYMENT_CONFIRMED: { tab: 'my-bookings' },
  // Las visitas llevan a la sección de visitas del rol actual (propietario o interesado).
  VISIT_REQUESTED: { tab: 'visits' },
  VISIT_CONFIRMED: { tab: 'visits' },
  VISIT_DECLINED: { tab: 'visits' },
  VISIT_CANCELLED: { tab: 'visits' }
};

const TONES: Partial<Record<NotificationType, 'success' | 'danger' | 'warning'>> = {
  BOOKING_APPROVED: 'success', PAYMENT_CONFIRMED: 'success', PAYMENT_RECEIVED: 'success',
  PUBLICATION_PAID: 'success', ROOM_APPROVED: 'success',
  BOOKING_REJECTED: 'danger', ROOM_REJECTED: 'danger', BOOKING_CANCELLED: 'danger',
  REVIEW_RECEIVED: 'warning',
  VISIT_REQUESTED: 'warning', VISIT_CONFIRMED: 'success', VISIT_DECLINED: 'danger', VISIT_CANCELLED: 'danger'
};

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css']
})
export class NotificationBellComponent {
  readonly notifications = inject(NotificationService);
  private host = inject(ElementRef<HTMLElement>);
  private relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  icon(type: NotificationType): string {
    return ICONS[type] || 'fa-bell';
  }

  tone(type: NotificationType): string {
    return TONES[type] || 'info';
  }

  badge(count: number): string {
    return count > 9 ? '9+' : String(count);
  }

  /** "hace 5 minutos", "ayer"... La fecha del backend viene en hora de Lima sin zona. */
  timeAgo(iso: string): string {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 60) return 'hace un momento';
    if (abs < 3600) return this.relative.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return this.relative.format(Math.round(seconds / 3600), 'hour');
    if (abs < 604800) return this.relative.format(Math.round(seconds / 86400), 'day');
    return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  open(item: AppNotification): void {
    this.notifications.markAsRead(item);
    this.notifications.closePanel();
    const dest = DESTINATIONS[item.type];
    if (!dest) return;
    if (dest.tab === 'visits') {
      const owner = this.app.auth.isOwner();
      this.app.switchTab(owner ? 'owner-panel' : 'my-bookings');
      if (owner) this.app.ownerTab.set('visits');
      else this.app.tenantFilter.set('VISITS');
      this.app.loadVisits();
      return;
    }
    this.app.switchTab(dest.tab);
    if (dest.tab === 'owner-panel' && dest.ownerTab) {
      this.app.ownerTab.set(dest.ownerTab);
      this.app.loadOwnerData();
    } else if (dest.tab === 'my-bookings') {
      this.app.tenantFilter.set('ALL');
      this.app.loadTenantBookings();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notifications.panelOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.notifications.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.notifications.closePanel();
  }
}
