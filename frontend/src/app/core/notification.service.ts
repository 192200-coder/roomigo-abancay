import { Injectable, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ApiResponse, AppNotification, PageResponse } from './models';
import { getApiBaseUrl } from './api-config';

/** Cada cuánto se consulta el contador de no leídas mientras la pestaña está visible. */
const POLL_MS = 45_000;

/**
 * Notificaciones del usuario (campana del navbar).
 *
 * Importante: las consultas periódicas son SILENCIOSAS. Si el backend falla, no se muestra
 * ningún toast (antes un error de carga repetido llenaba la pantalla de avisos); simplemente
 * se reintenta en el siguiente ciclo.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly panelOpen = signal<boolean>(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly onVisibility = () => {
    if (document.visibilityState === 'visible') this.refreshCount();
  };

  private get baseUrl(): string {
    return `${getApiBaseUrl()}/notifications`;
  }

  constructor() {
    // Arranca o detiene el sondeo según haya sesión
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.start();
      } else {
        this.stop();
      }
    });
  }

  openPanel(): void {
    this.panelOpen.set(true);
    this.loadList();
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  togglePanel(): void {
    if (this.panelOpen()) this.closePanel(); else this.openPanel();
  }

  loadList(): void {
    this.loading.set(true);
    this.http.get<ApiResponse<PageResponse<AppNotification>>>(this.baseUrl, {
      headers: this.auth.getAuthHeaders(), params: { page: 0, size: 20 }
    }).subscribe({
      next: res => {
        this.items.set(res.data?.content || []);
        this.loading.set(false);
        this.refreshCount();
      },
      error: () => this.loading.set(false)
    });
  }

  refreshCount(): void {
    if (!this.auth.isLoggedIn()) return;
    this.http.get<ApiResponse<{ count: number }>>(`${this.baseUrl}/unread-count`, {
      headers: this.auth.getAuthHeaders()
    }).subscribe({
      next: res => this.unreadCount.set(res.data?.count ?? 0),
      error: () => { /* silencioso: se reintenta en el próximo ciclo */ }
    });
  }

  markAsRead(notification: AppNotification): void {
    if (notification.read) return;
    this.items.update(list => list.map(n => (n.id === notification.id ? { ...n, read: true } : n)));
    this.unreadCount.update(c => Math.max(0, c - 1));
    this.http.patch(`${this.baseUrl}/${notification.id}/read`, null, { headers: this.auth.getAuthHeaders() })
      .subscribe({ error: () => this.refreshCount() });
  }

  markAllAsRead(): void {
    this.items.update(list => list.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
    this.http.patch(`${this.baseUrl}/read-all`, null, { headers: this.auth.getAuthHeaders() })
      .subscribe({ error: () => this.refreshCount() });
  }

  private start(): void {
    if (this.timer || typeof window === 'undefined') return;
    this.refreshCount();
    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible') this.refreshCount();
    }, POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisibility);
    this.items.set([]);
    this.unreadCount.set(0);
    this.panelOpen.set(false);
  }
}
